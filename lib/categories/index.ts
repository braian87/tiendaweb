import { tvAudioCategory } from "./tv-audio"
import { tecnologiaCategory } from "./tecnologia"
import { accesoriosCelularCategory } from "./accesorios-celular"
import { electrodomesticosCategory } from "./electrodomesticos"
import { hogarCategory } from "./hogar"
import { seguridadCategory } from "./seguridad"
import { scooterMotosCategory } from "./scooter-motos"
import { bellezaCategory } from "./belleza"
import { perfumeriaCategory } from "./perfumeria"
import { celularesCategory } from "./celulares"
import { vapersCategory } from "./vapers"
import { maquillajeCategory } from "./maquillaje"

export const allCategories = [
  tvAudioCategory,
  tecnologiaCategory,
  accesoriosCelularCategory,
  electrodomesticosCategory,
  hogarCategory,
  seguridadCategory,
  scooterMotosCategory,
  bellezaCategory,
  perfumeriaCategory,
  celularesCategory,
  vapersCategory,
  maquillajeCategory,
]

export type Category = {
  id: string
  name: string
}
