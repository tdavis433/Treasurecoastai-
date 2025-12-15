export default function DownloadFiles() {
  const handleDownload = async () => {
    try {
      const response = await fetch('/api/download-project-zip');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'treasure-coast-ai.zip';
      a.click();
    } catch (e) {
      alert('Download failed');
    }
  };
  return (
    <div style={{padding: 40, background: '#000', minHeight: '100vh', color: '#fff'}}>
      <h1>Download Project Files</h1>
      <button onClick={handleDownload} style={{padding: '15px 30px', background: '#00E5CC', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold'}}>
        Download ZIP (794 KB)
      </button>
    </div>
  );
}
