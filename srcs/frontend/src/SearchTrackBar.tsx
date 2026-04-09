import React, { useState, useEffect } from 'react';

// Interfaz basada en tu backend (spotify.service.ts)
interface TrackData {
    track: string;
    artist: string;
    id: string;
}

const SearchBar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [results, setResults] = useState<TrackData[]>([]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchResults = async () => {
            // Si el término está vacío, limpiamos los resultados y cerramos el menú
            const cleanTerm = searchTerm.trim();
            if (!cleanTerm || cleanTerm.length < 3) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            try {
                // Llamada a tu API en el puerto 8443
                const response = await fetch(`/api/search?term=${encodeURIComponent(searchTerm)}`);

                if (!response.ok) {
                    throw new Error('Error en la respuesta de la red');
                }

                const data: TrackData[] = await response.json();
                setResults(data);
                setIsOpen(true);
            } catch (error) {
                console.error("Error al obtener los resultados:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        // Implementación de debounce para esperar a que el usuario termine de escribir (300ms)
        const delayDebounceFn = setTimeout(() => {
            fetchResults();
        }, 400);

        // Limpieza del timeout si el componente se desmonta o el término cambia
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    return (
        <div style={{ position: 'relative', width: '300px', fontFamily: 'sans-serif' }}>
            <input
                type="text"
                placeholder="Buscar canciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                    if (results.length > 0) setIsOpen(true);
                }}
                // Un pequeño delay en onBlur para permitir hacer clic en los resultados del desplegable
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                style={{
                    width: '100%',
                    padding: '10px',
                    boxSizing: 'border-box',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                }}
            />

            {loading && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'white', padding: '8px', border: '1px solid #ccc',
                    borderTop: 'none', borderRadius: '0 0 4px 4px', zIndex: 10
                }}>
                    Buscando...
                </div>
            )}

            {isOpen && results.length > 0 && !loading && (
                <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    border: '1px solid #ccc',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    backgroundColor: 'white',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {results.map((item) => (
                        <li
                            key={item.id}
                            style={{
                                padding: '10px',
                                borderBottom: '1px solid #eee',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                            onClick={() => {
                                // Al hacer clic, actualizamos el input con el formato deseado y cerramos
                                setSearchTerm(`${item.track} - ${item.artist}`);
                                setIsOpen(false);
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                            <strong>{item.track}</strong> - {item.artist}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;
