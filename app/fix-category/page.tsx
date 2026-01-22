'use client'

import { useState } from 'react'
import { fixCategoryMigration } from '@/app/actions/fix-category'

export default function FixCategoryPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFixCategory = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fixCategoryMigration()
      setResult(res)

      if (!res.success) {
        setError(res.error || 'Error desconocido')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-black">Reparar Categorías</h1>

        <div className="bg-black/5 rounded-lg p-6 mb-8">
          <p className="text-black/70 mb-4">
            Esta herramienta actualiza todos los productos con categoría antigua <code className="bg-black/10 px-2 py-1 rounded">"accesorios-celular"</code> a la nueva
            categoría <code className="bg-black/10 px-2 py-1 rounded">"Accesorios para celular"</code>
          </p>

          <button
            onClick={handleFixCategory}
            disabled={loading}
            className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-black/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Procesando...' : 'Ejecutar Migración'}
          </button>
        </div>

        {result && (
          <div className={`rounded-lg p-6 ${result.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <h2 className={`text-lg font-semibold mb-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.success ? '✅ Éxito' : '❌ Error'}
            </h2>
            <p className={result.success ? 'text-green-600' : 'text-red-600'}>
              {result.message || result.error}
            </p>
            {result.products && result.products.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-black">Productos actualizados:</h3>
                <ul className="space-y-2">
                  {result.products.map((p: any) => (
                    <li key={p.id} className="text-sm text-black/70">
                      • <code className="bg-black/5 px-1 rounded">{p.slug}</code> ({p.name})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
