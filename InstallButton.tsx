import { useEffect, useState } from "react";

let deferredPrompt: any;

export default function InstallButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    deferredPrompt = null;
    setShow(false);
  };

  if (!show) return null;

  return (
    <button
      onClick={install}
      className="fixed bottom-4 right-4 px-4 py-2 bg-black text-white rounded"
    >
      Install
    </button>
  );
}
