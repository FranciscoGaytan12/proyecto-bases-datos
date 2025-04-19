"use client"

import { motion } from "framer-motion"
import { Car, Home, Heart, Briefcase, Plane, Activity } from "lucide-react"


const availablePolicyTypes = [
  {
    id: "auto",
    name: "Seguro de Automóvil",
    description: "Protección completa para tu vehículo contra accidentes, robo y responsabilidad civil.",
    icon: Car,
    color: "bg-blue-100 text-blue-600",
    startingPrice: 299,
  },
  {
    id: "home",
    name: "Seguro de Hogar",
    description: "Protege tu casa y tus pertenencias contra incendios, robos y desastres naturales.",
    icon: Home,
    color: "bg-green-100 text-green-600",
    startingPrice: 199,
  },
  {
    id: "life",
    name: "Seguro de Vida",
    description: "Asegura el bienestar financiero de tus seres queridos en caso de fallecimiento.",
    icon: Heart,
    color: "bg-red-100 text-red-600",
    startingPrice: 149,
  },
  {
    id: "health",
    name: "Seguro de Salud",
    description: "Cobertura médica completa para ti y tu familia con acceso a los mejores especialistas.",
    icon: Activity,
    color: "bg-purple-100 text-purple-600",
    startingPrice: 249,
  },
  {
    id: "travel",
    name: "Seguro de Viaje",
    description: "Viaja tranquilo con cobertura médica, cancelación y pérdida de equipaje.",
    icon: Plane,
    color: "bg-yellow-100 text-yellow-600",
    startingPrice: 99,
  },
  {
    id: "business",
    name: "Seguro para Empresas",
    description: "Protección integral para tu negocio, empleados y activos comerciales.",
    icon: Briefcase,
    color: "bg-gray-100 text-gray-600",
    startingPrice: 399,
  },
]

function AvailablePolicies({ onSelectPolicy }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {availablePolicyTypes.map((policy) => (
        <motion.div
          key={policy.id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
          whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-5">
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-full ${policy.color} mr-3`}>
                <policy.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{policy.name}</h3>
            </div>

            <p className="text-gray-600 mb-4 h-12 line-clamp-2">{policy.description}</p>

            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-sm text-gray-500">Desde</span>
                <p className="text-xl font-bold text-gray-800">
                  {policy.startingPrice}$<span className="text-sm font-normal text-gray-500">/mes</span>
                </p>
              </div>
              <motion.button
                className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectPolicy(policy.id)}
              >
                Contratar
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default AvailablePolicies

