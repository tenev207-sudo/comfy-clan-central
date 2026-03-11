import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Keyboard } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "camera") return;

    const scannerId = "barcode-scanner-container";
    let scanner: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText);
            scanner?.stop().catch(() => {});
          },
          () => {}
        );
      } catch (err) {
        setError("Camera not available. Try manual entry.");
        setMode("manual");
      }
    };

    // Small delay so the DOM element exists
    const timeout = setTimeout(startScanner, 300);

    return () => {
      clearTimeout(timeout);
      scanner?.stop().catch(() => {});
    };
  }, [mode, onScan]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={mode === "camera" ? "default" : "outline"} size="sm" onClick={() => setMode("camera")} className="gap-1">
          <Camera className="h-4 w-4" /> Camera
        </Button>
        <Button variant={mode === "manual" ? "default" : "outline"} size="sm" onClick={() => { setMode("manual"); scannerRef.current?.stop().catch(() => {}); }} className="gap-1">
          <Keyboard className="h-4 w-4" /> Manual
        </Button>
      </div>

      {mode === "camera" ? (
        <div>
          <div id="barcode-scanner-container" className="w-full rounded-lg overflow-hidden" style={{ minHeight: 250 }} ref={containerRef} />
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          <p className="text-xs text-muted-foreground mt-2 text-center">Point your camera at a barcode or QR code</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            placeholder="Enter barcode number..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && manualCode && onScan(manualCode)}
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => manualCode && onScan(manualCode)} disabled={!manualCode}>
              Add Product
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
