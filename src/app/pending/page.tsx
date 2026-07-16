import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-md">
        <h1 className="text-2xl font-bold text-yellow-800 mb-4">Hesabın Onay Bekliyor</h1>
        <p className="text-yellow-700 mb-6">
          Hesabın henüz bir antrenör tarafından onaylanmadı. Onaylandıktan sonra
          uygulamayı kullanmaya başlayabilirsin.
        </p>
        <div className="bg-yellow-100 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-medium">Bu ne anlama geliyor?</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Hesabın oluşturuldu ve beklemeye alındı.</li>
            <li>Bir antrenör hesabını onayladığında bildirim alacaksın.</li>
            <li>Onay süreci genellikle kısa sürer.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}