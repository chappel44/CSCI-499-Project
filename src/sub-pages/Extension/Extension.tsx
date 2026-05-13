import { ArrowLeft, Download, ExternalLink, Puzzle, SearchCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Extension() {
  const downloadHref = "/verifind-extension-v2.zip";

  return (
    <section className="extension-page min-h-screen px-4 pt-24 pb-16 text-gray-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <Link
          to="/search"
          className="extension-back inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold shadow-sm transition hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Verifind
        </Link>

        <div className="grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="extension-kicker mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold shadow-sm">
              <Puzzle className="h-3.5 w-3.5" />
              Chrome extension preview
            </div>
            <h1 className="extension-title text-4xl font-black leading-tight md:text-5xl">
              Get Verifind while you shop.
            </h1>
            <p className="extension-copy mt-4 max-w-xl text-sm leading-6">
              The extension appears on supported retailer product pages, reads
              the item you are viewing, and checks Verifind for lower price
              candidates.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Walmart", "Ebay", "Amazon", "Google Shopping"].map(
                (retailer) => (
                  <span
                    key={retailer}
                    className="extension-chip rounded-full border px-3 py-1 text-xs font-bold"
                  >
                    {retailer}
                  </span>
                )
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={downloadHref}
                download
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-gray-800"
              >
                <Download className="h-4 w-4" />
                Get the extension
              </a>
              <a
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
              >
                Open search
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="extension-preview rounded-[20px] border p-5 shadow-xl">
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between bg-gradient-to-r from-[#00AAFF] to-[#6B30FF] px-4 py-3 text-white">
                <div>
                  <p className="text-sm font-black">Verifind Price Check</p>
                  <p className="text-xs opacity-85">Scan complete</p>
                </div>
                <SearchCheck className="h-5 w-5" />
              </div>
              <div className="space-y-4 p-4">
                <p className="extension-preview-title text-sm font-bold">
                  Amazon product page detected
                </p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="extension-muted text-xs">Amazon price</span>
                  <span className="extension-preview-title text-lg font-black">$129.99</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="extension-muted text-xs">Lowest found</span>
                  <span className="extension-preview-title text-lg font-black">$109.99</span>
                </div>
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                  Potential savings: $20.00
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Download and unzip the extension package.",
            "Open chrome://extensions and turn on Developer mode.",
            "Choose Load unpacked, then select the extension folder.",
          ].map((step, index) => (
            <div
              key={step}
              className="extension-step rounded-2xl border p-5 shadow-sm"
            >
              <p className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-950 text-sm font-black text-white">
                {index + 1}
              </p>
              <p className="text-sm font-semibold leading-6 text-gray-700">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
