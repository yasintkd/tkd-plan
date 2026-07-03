'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { clearSyncQueue, getSyncQueue } from '@/lib/offline';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    getSyncQueue().then((q) => setQueueLength(q.length));
  }, []);

  async function handleClearData() {
    if (!confirm('Tüm yerel verileri temizlemek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    localStorage.clear();
    alert('Yerel veriler temizlendi. Sayfa yenileniyor...');
    window.location.reload();
  }

  async function handleClearSyncQueue() {
    await clearSyncQueue();
    setQueueLength(0);
    alert('Senkronizasyon kuyruğu temizlendi.');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ayarlar</h1>

      <Card>
        <CardHeader>
          <CardTitle>PWA Kurulumu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            TKD Plan bir Progressive Web App (PWA) olarak çalışır. Aşağıdaki adımları izleyerek
            uygulamayı cihazınıza kurabilirsiniz:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Tarayıcınızın adres çubuğundaki <strong>Paylaş</strong> veya <strong>Menü</strong> ikonuna tıklayın.</li>
            <li><strong>Ana Ekrana Ekle</strong> veya <strong>Uygulamayı Yükle</strong> seçeneğini seçin.</li>
            <li>Talimatları takip ederek kurulumu tamamlayın.</li>
          </ol>
          <p className="text-sm text-gray-500">
            Kurulumdan sonra TKD Plan cihazınızda tam ekran, tarayıcı arayüzü olmadan çalışacaktır.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Senkronizasyon Kuyruğu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Offline iken yapılan değişiklikler bu kuyrukta bekletilir. İnternet bağlantısı
            geldiğinde otomatik olarak senkronize edilir.
          </p>
          <p className="text-sm font-medium">
            Bekleyen işlem sayısı: <span className="text-blue-900">{queueLength}</span>
          </p>
          {queueLength > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearSyncQueue}>
              Kuyruğu Temizle
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Tehlikeli Bölge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Tüm yerel verileri temizler (cache, IndexedDB, localStorage). Bu işlem sadece
            istemci tarafındaki verileri temizler, Supabase sunucunuzdaki veriler etkilenmez.
          </p>
          <Button variant="destructive" size="sm" onClick={handleClearData}>
            Yerel Verileri Temizle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uygulama Bilgisi</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-1">
          <p><strong>Versiyon:</strong> 1.0.0</p>
          <p><strong>Amaç:</strong> Taekwondo antrenmanlarını planlama, arşivleme ve takvimleme</p>
          <p><strong>Platform:</strong> PWA (Next.js + Supabase)</p>
        </CardContent>
      </Card>
    </div>
  );
}