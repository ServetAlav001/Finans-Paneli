# Basit Finans Paneli (React + Bootstrap 5)

Bu proje, temel finans işlemlerini simüle eden basit bir React uygulamasıdır. Hisse satın alma, hisse satma, portföydeki hisseleri görüntüleme, işlemleri listeleme ve yapılan işlemlere göre basit bir grafik gösterimi içerir.

## Özellikler

- **Hisse satın alma**: Hisse kodu, adet ve birim fiyat girerek portföye ekleme.
- **Hisse satma**: Portföydeki hisselerden adet düşerek satış yapma.
- **Satın alınan hisseleri görüntüleme**: Portföy tablosunda adet, ortalama alış fiyatı ve toplam tutarı görme.
- **Satılan işlemleri görüntüleme**: Alış ve satış işlemlerinin listelendiği tablo.
- **Anlık işlem grafiği**: Alış/satış işlemlerine göre net işlem tutarını gösteren basit bir çizgi grafik.
- **Hisse güncelleme**: Portföy tablosunda adet ve ortalama fiyatı güncelleme.
- **Bootstrap 5**: Düzen ve stil için Bootstrap 5 kullanımı.

## Kurulum

1. Proje klasörüne girin:

```bash
cd sirket-paneli
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

4. Tarayıcıda, terminalde yazan adresi (genelde `http://localhost:5173`) açın.

## Kullanım

- Sol taraftaki formdan **Alış** veya **Satış** seçerek hisse kodu, adet ve fiyat girin.
- Yaptığınız işlemler sağ tarafta:
  - **Portföy Özeti** tablosuna,
  - **İşlem Listesi** tablosuna,
  - **Anlık İşlem Grafiği** alanına anlık olarak yansır.
- Portföy tablosunda her satırın yanındaki **Güncelle** butonu ile ilgili hissenin adet ve ortalama fiyatını değiştirebilirsiniz.

Tüm veriler sadece tarayıcı hafızasında tutulur, sayfayı yenilediğinizde sıfırlanır.

# Basit-Finans-Paneli
# Finans-Paneli
