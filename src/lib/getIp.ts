export async function getLocalIP(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      
      let ipFound = false;

      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          if (!ipFound) resolve(null);
          return;
        }
        
        // Match IPv4
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = e.candidate.candidate.match(ipRegex);
        
        if (match) {
          const ip = match[1];
          // Exclude typical localhost and mDNS pseudo-IPs if we want actual LAN IPs
          if (ip !== '127.0.0.1' && !ip.endsWith('.local')) {
            ipFound = true;
            resolve(ip);
            pc.close();
          }
        }
      };

      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(() => resolve(null));
      
      // Fallback timeout
      setTimeout(() => {
        if (!ipFound) resolve(null);
        pc.close();
      }, 2000);
      
    } catch (e) {
      resolve(null);
    }
  });
}
