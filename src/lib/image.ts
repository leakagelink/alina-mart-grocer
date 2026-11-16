/** Reads a picked photo, shrinks it to max 800px on the long edge and returns a JPEG data URL. */
export function compressImage(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error("File padhi nahi ja saki"));
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 800 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * s;
        c.height = img.height * s;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = () => rej(new Error("Sirf photo (JPG/PNG) upload kariye"));
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}
