import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, S3_REGION } from '@/lib/s3';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Get folder type from query parameter, default to 'observations'
    const url = new URL(request.url);
    const folder = url.searchParams.get('folder') || 'observations';
    
    // Validate folder type
    const allowedFolders = ['observations', 'projects', 'project-updates'];
    const folderType = allowedFolders.includes(folder) ? folder : 'observations';
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const key = `${folderType}/${session.user.id}/${timestamp}-${randomString}.jpg`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize and optimize image with sharp
    // Max width 1500px, maintain aspect ratio, convert to JPEG with 85% quality
    const optimizedBuffer = await sharp(buffer)
      .resize(1500, null, {
        fit: 'inside',
        withoutEnlargement: true, // Don't upscale smaller images
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: 'image/jpeg',
    });

    console.log('Uploading to S3:', { bucket: S3_BUCKET, key, fileType: file.type, fileSize: file.size });

    await s3Client.send(command);

    console.log('Upload successful!');

    // Generate the URL
    const imageUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

    console.log('Generated URL:', imageUrl);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
