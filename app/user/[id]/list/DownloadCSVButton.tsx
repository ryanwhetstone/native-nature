'use client';

interface Observation {
  id: string;
  observedAt: Date;
  city: string | null;
  region: string | null;
  country: string | null;
  species: {
    name: string;
    preferredCommonName: string | null;
  };
}

export function DownloadCSVButton({ 
  observations, 
  userName 
}: { 
  observations: Observation[]; 
  userName: string;
}) {
  const downloadCSV = () => {
    // Create CSV header
    const headers = ['Common Name', 'Scientific Name', 'Date Observed', 'Location'];
    
    // Create CSV rows
    const rows = observations.map(obs => [
      obs.species.preferredCommonName || obs.species.name,
      obs.species.name,
      new Date(obs.observedAt).toLocaleDateString(),
      [obs.city, obs.region, obs.country].filter(Boolean).join(', ') || 'Location recorded'
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${userName}-observations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={downloadCSV}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download CSV
    </button>
  );
}
