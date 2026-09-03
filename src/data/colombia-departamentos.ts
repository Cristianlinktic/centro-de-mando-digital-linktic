// Lista canónica de los 33 departamentos de Colombia.
// id = código DANE; nombre coincide (al normalizar) con NOMBRE_DPT del GeoJSON
// public/colombia-departamentos.geojson. lat/lng = centroide (para la cámara).
// Esta lista da identidad y geometría; las métricas (Instagram) viven en la tabla
// actores_colombia y se editan desde el editor de la sección.

export interface DepartamentoBase {
  id: string;
  nombre: string;
  displayNombre?: string;
  capital: string;
  lat: number;
  lng: number;
}

export const COLOMBIA_DEPARTAMENTOS: DepartamentoBase[] = [
  { id: "05", nombre: "Antioquia", capital: "Medellín", lat: 7.001, lng: -75.836 },
  { id: "08", nombre: "Atlántico", capital: "Barranquilla", lat: 10.675, lng: -74.973 },
  { id: "11", nombre: "Santafé de Bogotá D.C", displayNombre: "Bogotá D.C", capital: "Bogotá", lat: 4.286, lng: -74.211 },
  { id: "13", nombre: "Bolívar", capital: "Cartagena", lat: 9.125, lng: -74.764 },
  { id: "15", nombre: "Boyacá", capital: "Tunja", lat: 5.849, lng: -73.295 },
  { id: "17", nombre: "Caldas", capital: "Manizales", lat: 5.351, lng: -75.38 },
  { id: "18", nombre: "Caquetá", capital: "Florencia", lat: 0.667, lng: -73.81 },
  { id: "19", nombre: "Cauca", capital: "Popayán", lat: 2.324, lng: -76.835 },
  { id: "20", nombre: "Cesar", capital: "Valledupar", lat: 9.29, lng: -73.524 },
  { id: "23", nombre: "Córdoba", capital: "Montería", lat: 8.531, lng: -75.697 },
  { id: "25", nombre: "Cundinamarca", capital: "Bogotá", lat: 4.755, lng: -74.174 },
  { id: "27", nombre: "Chocó", capital: "Quibdó", lat: 6.016, lng: -77.004 },
  { id: "41", nombre: "Huila", capital: "Neiva", lat: 2.665, lng: -75.602 },
  { id: "44", nombre: "La Guajira", capital: "Riohacha", lat: 11.452, lng: -72.493 },
  { id: "47", nombre: "Magdalena", capital: "Santa Marta", lat: 10.189, lng: -74.265 },
  { id: "50", nombre: "Meta", capital: "Villavicencio", lat: 3.218, lng: -73.111 },
  { id: "52", nombre: "Nariño", capital: "Pasto", lat: 1.574, lng: -77.822 },
  { id: "54", nombre: "Norte de Santander", capital: "Cúcuta", lat: 7.871, lng: -72.949 },
  { id: "63", nombre: "Quindío", capital: "Armenia", lat: 4.498, lng: -75.702 },
  { id: "66", nombre: "Risaralda", capital: "Pereira", lat: 5.061, lng: -75.893 },
  { id: "68", nombre: "Santander", capital: "Bucaramanga", lat: 6.611, lng: -73.428 },
  { id: "70", nombre: "Sucre", capital: "Sincelejo", lat: 9.135, lng: -75.206 },
  { id: "73", nombre: "Tolima", capital: "Ibagué", lat: 4.076, lng: -75.212 },
  { id: "76", nombre: "Valle del Cauca", capital: "Cali", lat: 3.98, lng: -76.566 },
  { id: "81", nombre: "Arauca", capital: "Arauca", lat: 6.481, lng: -71.18 },
  { id: "85", nombre: "Casanare", capital: "Yopal", lat: 5.445, lng: -71.737 },
  { id: "86", nombre: "Putumayo", capital: "Mocoa", lat: 0.338, lng: -75.618 },
  { id: "88", nombre: "Archipiélago de San Andrés Providencia y Santa Catalina", capital: "San Andrés", lat: 13.017, lng: -81.523 },
  { id: "91", nombre: "Amazonas", capital: "Leticia", lat: -1.442, lng: -71.734 },
  { id: "94", nombre: "Guainía", capital: "Inírida", lat: 2.831, lng: -68.86 },
  { id: "95", nombre: "Guaviare", capital: "San José del Guaviare", lat: 1.914, lng: -71.868 },
  { id: "97", nombre: "Vaupés", capital: "Mitú", lat: 0.321, lng: -70.573 },
  { id: "99", nombre: "Vichada", capital: "Puerto Carreño", lat: 4.252, lng: -69.261 },
];
