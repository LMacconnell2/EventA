import {
  ArrowLeft,
  CheckCircle2,
  Keyboard,
  ScanLine,
  XCircle,
} from "lucide-react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import type { EventAttendee } from "../api/eventAttendeeApi";

const SCANNER_ELEMENT_ID =
  "event-attendee-qr-reader";

type ScanResult = {
  type: "success" | "error";
  message: string;
  attendee?: EventAttendee;
};

type AttendeeCheckInScannerProps = {
  eventId: number;
  checkedInCount: number;
  onBack: () => void;
  onTicketCode: (
    ticketCode: string,
  ) => Promise<EventAttendee>;
};

export function AttendeeCheckInScanner({
  checkedInCount,
  onBack,
  onTicketCode,
}: AttendeeCheckInScannerProps) {
  const [manualCode, setManualCode] =
    useState("");

  const [result, setResult] =
    useState<ScanResult | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const processingCodeRef =
    useRef<string | null>(null);

  const processCode = useCallback(
    async (rawCode: string): Promise<void> => {
      const code = rawCode.trim();

      if (
        !code ||
        isSubmitting ||
        processingCodeRef.current === code
      ) {
        return;
      }

      processingCodeRef.current = code;
      setIsSubmitting(true);
      setResult(null);

      try {
        const attendee =
          await onTicketCode(code);

        setResult({
          type: "success",
          message: `${attendee.attendee_name} was checked in successfully.`,
          attendee,
        });

        setManualCode("");
      } catch (error) {
        setResult({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "The ticket could not be checked in.",
        });
      } finally {
        setIsSubmitting(false);

        window.setTimeout(() => {
          processingCodeRef.current = null;
        }, 1500);
      }
    },
    [isSubmitting, onTicketCode],
  );

  useEffect(() => {
    const scanner = new Html5Qrcode(
      SCANNER_ELEMENT_ID,
      {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      },
    );

    let disposed = false;
    let started = false;

    async function startScanner() {
      try {
        await scanner.start(
          {
            facingMode: "environment",
          },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          (decodedText) => {
            void processCode(decodedText);
          },
          () => {
            // Ignore normal scan misses.
          },
        );

        if (disposed) {
          await scanner
            .stop()
            .catch(() => undefined);

          await scanner
            .clear()
            .catch(() => undefined);

          return;
        }

        started = true;
      } catch (error) {
        if (!disposed) {
          setResult({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Camera access could not be started.",
          });
        }
      }
    }

    void startScanner();

    return () => {
      disposed = true;

      void (async () => {
        if (started) {
          await scanner
            .stop()
            .catch(() => undefined);
        }

        await scanner
          .clear()
          .catch(() => undefined);
      })();
    };
  }, []);

  function handleManualSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    void processCode(manualCode);
  }

  return (
    <section className="event-checkin-view">
      <header className="event-checkin-view__header">
        <button
          type="button"
          className="event-secondary-action"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back to Attendees
        </button>

        <div>
          <span>Currently checked in</span>
          <strong>
            {checkedInCount.toLocaleString()}
          </strong>
        </div>
      </header>

      <div className="event-checkin-intro">
        <ScanLine size={28} />

        <div>
          <h2>Scan attendee tickets</h2>
          <p>
            Point the device camera at an attendee’s
            ticket QR code.
          </p>
        </div>
      </div>

      <div className="event-checkin-scanner">
        <div id={SCANNER_ELEMENT_ID} />
      </div>

      <form
        className="event-checkin-manual"
        onSubmit={handleManualSubmit}
      >
        <label htmlFor="manual-ticket-code">
          <Keyboard size={18} />
          Enter ticket code manually
        </label>

        <div>
          <input
            id="manual-ticket-code"
            type="text"
            value={manualCode}
            placeholder="Enter ticket code"
            autoComplete="off"
            onChange={(event) =>
              setManualCode(event.target.value)
            }
          />

          <button
            type="submit"
            className="event-primary-action"
            disabled={
              !manualCode.trim() ||
              isSubmitting
            }
          >
            {isSubmitting
              ? "Checking..."
              : "Check In"}
          </button>
        </div>
      </form>

      {result && (
        <div
          className={[
            "event-checkin-result",
            `event-checkin-result--${result.type}`,
          ].join(" ")}
          role="status"
        >
          {result.type === "success" ? (
            <CheckCircle2 size={24} />
          ) : (
            <XCircle size={24} />
          )}

          <div>
            <strong>
              {result.type === "success"
                ? "Check-in complete"
                : "Check-in failed"}
            </strong>

            <p>{result.message}</p>
          </div>
        </div>
      )}
    </section>
  );
}