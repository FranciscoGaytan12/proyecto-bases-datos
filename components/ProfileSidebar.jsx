"use client"

import { motion } from "framer-motion"
import { User, Shield, Lock } from "lucide-react"

function ProfileSidebar({ activeTab, setActiveTab }) {
  const tabs = [
    {
      id: "personal-info",
      label: "Información Personal",
      icon: User,
    },
    {
      id: "policies",
      label: "Mis Pólizas",
      icon: Shield,
    },
    {
      id: "security",
      label: "Seguridad",
      icon: Lock,
    },
  ]

  return (
    <div className="w-full md:w-64 bg-gray-50 p-6 border-r border-gray-200">
      <nav>
        <ul className="space-y-2">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <motion.button
                className={`w-full flex items-center p-3 rounded-md transition-colors ${
                  activeTab === tab.id ? "bg-blue-400 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
                whileHover={{ x: activeTab !== tab.id ? 5 : 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                <span>{tab.label}</span>
              </motion.button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default ProfileSidebar

