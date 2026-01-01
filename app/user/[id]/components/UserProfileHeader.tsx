import Image from "next/image";
import { UserProfileNav } from "./UserProfileNav";

interface UserProfileHeaderProps {
    userId: string;
    displayName: string;
    userImage: string | null;
    userBio: string | null;
    observationsCount: number;
    photosCount: number;
    projectsCount: number;
    favoritesCount: number;
}

export function UserProfileHeader({
    userId,
    displayName,
    userImage,
    userBio,
    observationsCount,
    photosCount,
    projectsCount,
    favoritesCount,
}: UserProfileHeaderProps) {
    return (
        <div className="section bg-dark">
            <div className="container-lg">
                {/* Profile Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center justify-start gap-6 w-full">
                        {userImage && (
                            <div className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                                <Image
                                    src={userImage}
                                    alt={displayName}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="w-full">

                            <div className="flex-gap-md">
                                <div className="flex justify-between">
                                    <h1 className="heading-2 text-white">
                                        {displayName}
                                    </h1>
                                    <div>
                                        <UserProfileNav
                                            userId={userId}
                                            observationsCount={observationsCount}
                                            photosCount={photosCount}
                                            projectsCount={projectsCount}
                                            favoritesCount={favoritesCount}
                                        />
                                    </div>

                                </div>
                                {userBio && (
                                    <p className="text-white">{userBio}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
