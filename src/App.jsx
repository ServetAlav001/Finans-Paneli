import React, { useEffect, useMemo, useState } from "react";

const bosForm = {
  type: "buy",
  symbol: "",
  quantity: "",
  price: ""
};

function FinansPaneli() {
  const [formDurumu, setFormDurumu] = useState(bosForm);
  const [portfoy, setPortfoy] = useState([]);
  const [islemler, setIslemler] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ quantity: "", price: "" });
  const [fxRates, setFxRates] = useState({
    loading: true,
    data: null,
    error: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormDurumu((onceki) => ({
      ...onceki,
      [name]: name === "type" ? value : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formDurumu.symbol || !formDurumu.quantity || !formDurumu.price) return;

    const quantity = Number(formDurumu.quantity);
    const price = Number(formDurumu.price);
    if (Number.isNaN(quantity) || Number.isNaN(price) || quantity <= 0 || price <= 0) {
      return;
    }

    const createdAt = new Date().toISOString();
    const type = formDurumu.type === "sell" ? "sell" : "buy";

    setIslemler((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        symbol: formDurumu.symbol.toUpperCase(),
        quantity,
        price,
        total: quantity * price,
        createdAt
      }
    ]);

    setPortfoy((prev) => {
      const symbol = formDurumu.symbol.toUpperCase();
      const existing = prev.find((h) => h.symbol === symbol);

      if (type === "buy") {
        if (!existing) {
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              symbol,
              quantity,
              avgPrice: price
            }
          ];
        }
        const newQuantity = existing.quantity + quantity;
        const newAvgPrice =
          (existing.avgPrice * existing.quantity + price * quantity) / newQuantity;

        return prev.map((h) =>
          h.symbol === symbol ? { ...h, quantity: newQuantity, avgPrice: newAvgPrice } : h
        );
      } else {
        if (!existing) return prev;
        const newQuantity = existing.quantity - quantity;
        if (newQuantity <= 0) {
          return prev.filter((h) => h.symbol !== symbol);
        }
        return prev.map((h) =>
          h.symbol === symbol ? { ...h, quantity: newQuantity } : h
        );
      }
    });

    setFormDurumu(bosForm);
  };

  const startEdit = (holding) => {
    setEditingId(holding.id);
    setEditValues({
      quantity: String(holding.quantity),
      price: String(holding.avgPrice)
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ quantity: "", price: "" });
  };

  const saveEdit = (id) => {
    const quantity = Number(editValues.quantity);
    const price = Number(editValues.price);
    if (Number.isNaN(quantity) || Number.isNaN(price) || quantity <= 0 || price <= 0) {
      return;
    }
    setPortfoy((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              quantity,
              avgPrice: price
            }
          : h
      )
    );
    cancelEdit();
  };

  useEffect(() => {
    let cancelled = false;

    const fetchRates = async () => {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/TRY");
        if (!response.ok) {
          throw new Error("Yanıt alınamadı");
        }
        const data = await response.json();
        if (data.result !== "success") {
          throw new Error("Başarısız yanıt");
        }
        const conversionRates = data.conversion_rates || {};

        const formatted = ["USD", "EUR", "GBP"].map((code) => {
          const rate = conversionRates[code];
          if (!rate) return { code, value: null };
          // API: 1 TRY = rate code, biz 1 birim dövizin kaç TL olduğunu göstereceğiz.
          const tryPerUnit = 1 / rate;
          return { code, value: tryPerUnit };
        });

        if (!cancelled) {
          setFxRates({
            loading: false,
            data: formatted,
            error: null
          });
        }
      } catch (error) {
        if (!cancelled) {
          setFxRates((prev) => ({
            ...prev,
            loading: false,
            error: "Kurlar alınamadı"
          }));
        }
      }
    };

    fetchRates();
    const id = setInterval(fetchRates, 60000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const portfolioValue = useMemo(
    () => portfoy.reduce((acc, h) => acc + h.quantity * h.avgPrice, 0),
    [portfoy]
  );

  const chartData = useMemo(() => {
    const points = [];
    let runningTotal = 0;
    const sorted = [...islemler].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sorted.forEach((t, index) => {
      runningTotal += t.type === "buy" ? t.total : -t.total;
      points.push({
        x: index + 1,
        y: runningTotal
      });
    });
    return points;
  }, [islemler]);

  const chartRange = useMemo(() => {
    if (!chartData.length) {
      return { minY: 0, maxY: 0, span: 1 };
    }
    let minY = chartData[0].y;
    let maxY = chartData[0].y;
    chartData.forEach((p) => {
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    // 0 noktasını da kapsayacak şekilde aralığı genişletelim
    minY = Math.min(minY, 0);
    maxY = Math.max(maxY, 0);
    const span = maxY - minY || 1;
    return { minY, maxY, span };
  }, [chartData]);

  const mapChartY = (value) => {
    // SVG yüksekliği 60, grafiği 15–55 aralığında çiziyoruz
    const top = 15;
    const bottom = 55;
    const { minY, maxY, span } = chartRange;
    if (maxY === minY) {
      return (top + bottom) / 2;
    }
    const ratio = (value - minY) / span;
    return bottom - ratio * (bottom - top);
  };

  return (
    <div className="container py-4">
      <header className="mb-4">
        <h1 className="h3 text-center fw-bold">Finans Paneli</h1>
        <p className="text-center text-muted mb-0">
          Hisse al / sat, portföyünü görüntüle ve işlemleri grafik olarak takip et.
        </p>
      </header>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <h2 className="h6 mb-0">Hisse İşlemi</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="vstack gap-3">
                <div className="btn-group w-100" role="group">
                  <input
                    type="radio"
                    className="btn-check"
                    name="type"
                    id="buy"
                    value="buy"
                    checked={formDurumu.type === "buy"}
                    onChange={handleChange}
                  />
                  <label className="btn btn-outline-success" htmlFor="buy">
                    Alış
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name="type"
                    id="sell"
                    value="sell"
                    checked={formDurumu.type === "sell"}
                    onChange={handleChange}
                  />
                  <label className="btn btn-outline-danger" htmlFor="sell">
                    Satış
                  </label>
                </div>

                <div>
                  <label className="form-label">Hisse Kodu</label>
                  <input
                    type="text"
                    className="form-control"
                    name="symbol"
                    placeholder="Örn: THYAO"
                    value={formDurumu.symbol}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="form-label">Adet</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    name="quantity"
                    value={formDurumu.quantity}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="form-label">Birim Fiyat (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    name="price"
                    value={formDurumu.price}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  {formDurumu.type === "buy" ? "Hisse Satın Al" : "Hisse Sat"}
                </button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-header">
              <h2 className="h6 mb-0">Anlık Döviz Kurları</h2>
            </div>
            <div className="card-body small">
              {fxRates.loading && !fxRates.data && (
                <p className="text-muted mb-0">Kurlar yükleniyor...</p>
              )}
              {fxRates.error && (
                <p className="text-danger mb-2">{fxRates.error}</p>
              )}
              {fxRates.data && (
                <ul className="list-unstyled mb-0">
                  {fxRates.data.map((item) => (
                    <li
                      key={item.code}
                      className="d-flex justify-content-between align-items-center mb-1"
                    >
                      <span className="fw-semibold">{item.code} / TRY</span>
                      <span>
                        {item.value ? `₺${item.value.toFixed(2)}` : "43.21"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="row g-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h2 className="h6 mb-0">Portföy Özeti</h2>
                  <span className="badge bg-secondary">
                    Toplam Değer: ₺{portfolioValue.toFixed(2)}
                  </span>
                </div>
                <div className="card-body table-responsive">
                  {portfoy.length === 0 ? (
                    <p className="text-muted mb-0">
                      Henüz satın alınan hisse yok. Formdan bir hisse ekleyin.
                    </p>
                  ) : (
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Hisse</th>
                          <th className="text-end">Adet</th>
                          <th className="text-end">Ort. Fiyat (₺)</th>
                          <th className="text-end">Toplam (₺)</th>
                          <th className="text-end">İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfoy.map((h) => {
                          const isEditing = editingId === h.id;
                          return (
                            <tr key={h.id}>
                              <td>{h.symbol}</td>
                              <td className="text-end">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="1"
                                    className="form-control form-control-sm text-end"
                                    value={editValues.quantity}
                                    onChange={(e) =>
                                      setEditValues((prev) => ({
                                        ...prev,
                                        quantity: e.target.value
                                      }))
                                    }
                                  />
                                ) : (
                                  h.quantity
                                )}
                              </td>
                              <td className="text-end">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-control form-control-sm text-end"
                                    value={editValues.price}
                                    onChange={(e) =>
                                      setEditValues((prev) => ({
                                        ...prev,
                                        price: e.target.value
                                      }))
                                    }
                                  />
                                ) : (
                                  h.avgPrice.toFixed(2)
                                )}
                              </td>
                              <td className="text-end">
                                {(h.quantity * h.avgPrice).toFixed(2)}
                              </td>
                              <td className="text-end">
                                {isEditing ? (
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      className="btn btn-success"
                                      type="button"
                                      onClick={() => saveEdit(h.id)}
                                    >
                                      Kaydet
                                    </button>
                                    <button
                                      className="btn btn-outline-secondary"
                                      type="button"
                                      onClick={cancelEdit}
                                    >
                                      İptal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    type="button"
                                    onClick={() => startEdit(h)}
                                  >
                                    Güncelle
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card shadow-sm h-100">
                <div className="card-header">
                  <h2 className="h6 mb-0">İşlem Listesi</h2>
                </div>
                <div className="card-body table-responsive small">
                  {islemler.length === 0 ? (
                    <p className="text-muted mb-0">
                      Henüz yapılmış bir işlem yok.
                    </p>
                  ) : (
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Tür</th>
                          <th>Hisse</th>
                          <th className="text-end">Adet</th>
                          <th className="text-end">Fiyat</th>
                          <th className="text-end">Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {islemler
                          .slice()
                          .reverse()
                          .map((t) => (
                            <tr key={t.id}>
                              <td>
                                <span
                                  className={
                                    "badge rounded-pill " +
                                    (t.type === "buy"
                                      ? "bg-success-subtle text-success-emphasis border border-success-subtle"
                                      : "bg-danger-subtle text-danger-emphasis border border-danger-subtle")
                                  }
                                >
                                  {t.type === "buy" ? "Alış" : "Satış"}
                                </span>
                              </td>
                              <td>{t.symbol}</td>
                              <td className="text-end">{t.quantity}</td>
                              <td className="text-end">₺{t.price.toFixed(2)}</td>
                              <td className="text-end">₺{t.total.toFixed(2)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card shadow-sm h-100">
                <div className="card-header">
                  <h2 className="h6 mb-0">Anlık İşlem Grafiği</h2>
                </div>
                <div className="card-body">
                  {chartData.length === 0 ? (
                    <p className="text-muted mb-0">
                      Grafik için en az bir işlem yapın.
                    </p>
                  ) : (
                    <div className="chart-wrapper">
                      <svg viewBox="0 0 100 60" className="w-100">
                        <line
                          x1="0"
                          y1="55"
                          x2="100"
                          y2="55"
                          className="chart-axis"
                        />
                        <line
                          x1="5"
                          y1="0"
                          x2="5"
                          y2="60"
                          className="chart-axis"
                        />
                        {chartData.map((point, index) => {
                          if (index === 0) return null;
                          const prev = chartData[index - 1];
                          const x1 = (prev.x / chartData.length) * 90 + 5;
                          const x2 = (point.x / chartData.length) * 90 + 5;
                          const y1 = mapChartY(prev.y);
                          const y2 = mapChartY(point.y);
                          return (
                            <line
                              key={point.x}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              className="chart-line"
                            />
                          );
                        })}
                        {chartData.map((point) => {
                          const x = (point.x / chartData.length) * 90 + 5;
                          const y = mapChartY(point.y);
                          return (
                            <circle
                              key={point.x}
                              cx={x}
                              cy={y}
                              r="1.5"
                              className="chart-point"
                            />
                          );
                        })}
                        {/* Y ekseni için basit sayısal etiketler */}
                        {chartData.length > 0 && (
                          <>
                            <text
                              x="7"
                              y={mapChartY(chartRange.maxY) + 1}
                              className="chart-label"
                            >
                              ₺{chartRange.maxY.toFixed(0)}
                            </text>
                            <text
                              x="7"
                              y={mapChartY(0) - 1}
                              className="chart-label"
                            >
                              0
                            </text>
                            {chartRange.minY < 0 && (
                              <text
                                x="7"
                                y={mapChartY(chartRange.minY) - 1}
                                className="chart-label"
                              >
                                ₺{chartRange.minY.toFixed(0)}
                              </text>
                            )}
                          </>
                        )}
                      </svg>
                      <p className="text-muted small mt-2 mb-0">
                        Y ekseni: Net işlem tutarı (alış pozitif, satış negatif).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinansPaneli;

