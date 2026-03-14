// Barcode olvasó logika

let videoStream = null;

// Kamera elindítása
async function startBarcodeScanner() {
  const barcodeInput = document.getElementById("barcode");
  
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const video = document.createElement("video");
    video.srcObject = videoStream;
    video.setAttribute("playsinline", true);
    video.play();
    
    // Kamera overlay (opcionális)
    const modalBox = document.querySelector(".modalBox");
    modalBox.appendChild(video);

    // Beolvasás ciklus
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scanLoop = () => {
      if(video.readyState === video.HAVE_ENOUGH_DATA){
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Itt lehetne tényleges barcode detektálás pl. jsQR vagy QuaggaJS
        // jelenleg demo jelleggel csak a video kép van
      }
      requestAnimationFrame(scanLoop);
    };
    scanLoop();

  } catch(err) {
    console.warn("Kamera nem elérhető, használj manuális beírást.", err);
    barcodeInput.disabled = false;
  }
}

// Kamera leállítása
function stopBarcodeScanner() {
  if(videoStream){
    videoStream.getTracks().forEach(track => track.stop());
  }
}

// Ha a modal megnyílik, próbálja indítani a barcode-t
document.getElementById("modal").addEventListener("click", function(){
  startBarcodeScanner();
});
