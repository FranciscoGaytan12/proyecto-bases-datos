'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";

const SegurosAgentes = () => {
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgentes = async () => {
      try {
        const response = await fetch('/api/agentes');
        if (!response.ok) {
          throw new Error('Error al cargar los agentes');
        }
        const data = await response.json();
        setAgentes(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAgentes();
  }, []);

  if (loading) return <div>Cargando agentes...</div>;
  if (error) return <div>Error: {error}</div>;

  const getStatusBadgeColor = (estado) => {
    const colors = {
      activo: "bg-green-500",
      inactivo: "bg-gray-500",
      suspendido: "bg-red-500"
    };
    return colors[estado] || "bg-gray-500";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agentes de Seguros</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Licencia</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentes.map((agente) => (
              <TableRow key={agente.id}>
                <TableCell>{`${agente.nombre} ${agente.apellido}`}</TableCell>
                <TableCell className="capitalize">{agente.especialidad}</TableCell>
                <TableCell>{agente.email}</TableCell>
                <TableCell>{agente.telefono}</TableCell>
                <TableCell>{agente.num_licencia}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusBadgeColor(agente.estado)}>
                    {agente.estado}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SegurosAgentes;
