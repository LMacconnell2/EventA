import {
  Download,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import {
  useEffect,
  useState,
} from "react";

import type { EventAttendee } from "../api/eventAttendeeApi";

type AttendeeQrCodeModalProps = {
  attendee: EventAttendee | null;
  onClose: () => void;
};

function sanitizeFileName(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "attendee"
  );
}

export function AttendeeQrCodeModal({
  attendee,
  onClose,
}: AttendeeQrCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!attendee) {
      setQrCodeUrl(null);
      setError(null);
      return;
    }

    const currentAttendee = attendee;
    let cancelled = false;

    async function generateQrCode() {
      try {
        setError(null);

        const dataUrl = await QRCode.toDataURL(
          currentAttendee.ticket_code,
          {
            width: 640,
            margin: 4,
            errorCorrectionLevel: "H",
          },
        );

        if (!cancelled) {
          setQrCodeUrl(dataUrl);
        }
      } catch {
        if (!cancelled) {
          setError(
            "The QR code could not be generated.",
          );
        }
      }
    }

    void generateQrCode();

    return () => {
      cancelled = true;
    };
  }, [attendee]);

  if (!attendee) {
    return null;
  }

  const attendeeName =
    attendee.attendee_name ||
    [
      attendee.attendee_fname,
      attendee.attendee_lname,
    ]
      .filter(Boolean)
      .join(" ");

  function handleDownload() {
    if (!qrCodeUrl) {
      return;
    }

    const anchor = document.createElement("a");

    anchor.href = qrCodeUrl;
    anchor.download = `${sanitizeFileName(
      attendeeName,
    )}-ticket-qr.png`;

    anchor.click();
  }

  return (
    <div
      className="event-attendee-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="event-attendee-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendee-qr-title"
      >
        <header className="event-attendee-modal__header">
          <div>
            <span>Ticket QR code</span>

            <h2 id="attendee-qr-title">
              {attendeeName}
            </h2>
          </div>

          <button
            type="button"
            className="event-icon-button"
            aria-label="Close QR code"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <div className="event-attendee-qr">
          {error ? (
            <p className="event-attendee-action-error">
              {error}
            </p>
          ) : qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={`QR code for ${attendeeName}`}
            />
          ) : (
            <p>Generating QR code...</p>
          )}
        </div>

        <div className="event-attendee-qr-details">
          <strong>{attendee.ticket_name}</strong>
          <span>{attendee.email}</span>

          <code>{attendee.ticket_code}</code>
        </div>

        <footer className="event-attendee-modal__footer">
          <button
            type="button"
            className="event-secondary-action"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="event-primary-action"
            disabled={!qrCodeUrl}
            onClick={handleDownload}
          >
            <Download size={18} />
            Save QR Code
          </button>
        </footer>
      </section>
    </div>
  );
}