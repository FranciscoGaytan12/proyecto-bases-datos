"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"

function ImageUploader({ onImageSelected }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Crear URL para previsualización
    const fileUrl = URL.createObjectURL(file)
    setPreviewUrl(fileUrl)

    // Pasar la URL al componente padre
    if (onImageSelected) {
      onImageSelected(fileUrl)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  return (
    <div className="mb-6">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-amber-600 text-white px-4 py-2 rounded-md mb-4"
        onClick={handleButtonClick}
      >
        Seleccionar imagen
      </motion.button>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {previewUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
          <img
            src={previewUrl || "/placeholder.svg"}
            alt="Vista previa"
            className="w-full max-w-md h-auto rounded-md border border-gray-300"
          />
        </div>
      )}
    </div>
  )
}

export default ImageUploader

