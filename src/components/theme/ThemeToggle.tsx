"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sun, Moon, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
}

// Definición de los temas disponibles
interface ThemeOption {
  name: string;
  value: string;
  description?: string;
  colors?: {
    primary: string;
    background: string;
    accent: string;
  };
}

// Componente para mostrar la paleta de colores del tema
const ThemePalette = ({ colors }: { colors: ThemeOption["colors"] }) => {
  if (!colors) return null;
  
  return (
    <div className="flex gap-1 mr-2">
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: colors.background }}
        title="Color de fondo"
      />
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: colors.primary }}
        title="Color primario"
      />
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: colors.accent }}
        title="Color de acento"
      />
    </div>
  );
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [customTheme, setCustomTheme] = useState<string | null>(null);

  // Asegurarse de que el componente solo se renderice en el cliente
  useEffect(() => {
    setMounted(true);
    
    // Restaurar el tema seleccionado al cargar la página
    const savedTheme = localStorage.getItem('selected-theme');
    if (savedTheme) {
      applyTheme(savedTheme);
      
      // Si es un tema personalizado, actualizar el estado
      if (savedTheme !== "light" && savedTheme !== "dark" && savedTheme !== "system") {
        setCustomTheme(savedTheme);
      }
    }
  }, []);

  // Definir los temas disponibles
  const basicThemes: ThemeOption[] = [
    { 
      name: "Light", 
      value: "light", 
      description: "Tema claro predeterminado",
      colors: {
        background: "#ffffff",
        primary: "#000000",
        accent: "#6e6e6e"
      }
    },
    { 
      name: "Dark", 
      value: "dark", 
      description: "Tema oscuro predeterminado",
      colors: {
        background: "#1c1c1c",
        primary: "#ffffff",
        accent: "#6e6e6e"
      }
    },
    { 
      name: "System", 
      value: "system", 
      description: "Basado en la configuración del sistema",
      colors: {
        background: "#f5f5f5",
        primary: "#1c1c1c",
        accent: "#6e6e6e"
      }
    },
  ];
  
  const customThemes: ThemeOption[] = [
    { 
      name: "Purple", 
      value: "purple-theme", 
      description: "Tema con tonos morados",
      colors: {
        background: "#f8f7ff",
        primary: "#ac4cb7",
        accent: "#e4f1e4"
      }
    },
    { 
      name: "Amber", 
      value: "amber-theme", 
      description: "Tema con tonos ámbar",
      colors: {
        background: "#fffaf0",
        primary: "#bb8a35",
        accent: "#d4a95f"
      }
    },
    { 
      name: "Blue", 
      value: "blue-theme", 
      description: "Tema con tonos azules",
      colors: {
        background: "#f0f8ff",
        primary: "#3b82f6",
        accent: "#93c5fd"
      }
    },
    { 
      name: "Bold Tech", 
      value: "bold-tech", 
      description: "Tema con estilo tecnológico",
      colors: {
        background: "#ffffff",
        primary: "#9b4dff",
        accent: "#eef2ff"
      }
    },
    { 
      name: "Notebook", 
      value: "notebook", 
      description: "Tema estilo cuaderno",
      colors: {
        background: "#fafafa",
        primary: "#7d7d7d",
        accent: "#f0e68c"
      }
    },
  ];

  // Obtener el nombre del tema personalizado actual
  // const getCurrentCustomThemeName = () => {
  //   if (!mounted || !customTheme) return "";
  //   const current = customThemes.find(t => t.value === customTheme);
  //   return current ? current.name : "";
  // };

  // Aplicar un tema específico
  const applyTheme = (themeValue: string) => {
    // Eliminar cualquier clase de tema anterior
    document.documentElement.classList.remove(
      "purple-theme",
      "amber-theme",
      "blue-theme",
      "bold-tech",
      "notebook",
    );
    
    // Guardar el tema seleccionado en localStorage para recordarlo
    localStorage.setItem('selected-theme', themeValue);
    
    // Si es un tema personalizado, agregar la clase correspondiente
    if (themeValue !== "light" && themeValue !== "dark" && themeValue !== "system") {
      document.documentElement.classList.add(themeValue);
      setCustomTheme(themeValue);
      
      // Para temas personalizados, mantener el modo claro/oscuro actual
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const currentTheme = theme || 'system';
      const isDark = currentTheme === "dark" || (currentTheme === "system" && prefersDark);
      
      // Aplicar el modo oscuro si corresponde
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Forzar la aplicación de las fuentes definidas en el tema
      // Esto asegura que las variables CSS de fuentes se apliquen correctamente
      setTimeout(() => {
        const computedStyle = getComputedStyle(document.documentElement);
        const fontSans = computedStyle.getPropertyValue('--font-sans').trim();
        const fontMono = computedStyle.getPropertyValue('--font-mono').trim();
        const fontSerif = computedStyle.getPropertyValue('--font-serif').trim();
        
        // Aplicar las fuentes directamente al body para asegurar que se apliquen
        if (fontSans) document.body.style.fontFamily = fontSans;
        
        // Actualizar las variables CSS globales
        document.documentElement.style.setProperty('--font-sans-applied', fontSans);
        document.documentElement.style.setProperty('--font-mono-applied', fontMono);
        document.documentElement.style.setProperty('--font-serif-applied', fontSerif);
        
        // Forzar actualización de estilos
        document.body.style.cssText += ' ';
      }, 10); // Pequeño retraso para asegurar que las clases CSS se hayan aplicado
    } else {
      // Para temas estándar (light/dark/system), usar next-themes
      setTheme(themeValue);
      setCustomTheme(null);
      
      // Restablecer las fuentes a las predeterminadas
      document.body.style.fontFamily = '';
      document.documentElement.style.removeProperty('--font-sans-applied');
      document.documentElement.style.removeProperty('--font-mono-applied');
      document.documentElement.style.removeProperty('--font-serif-applied');
    }
  };

  // Alternar entre modo claro y oscuro
  const toggleLightDark = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  };

  if (!mounted) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Cargando temas</span>
        </Button>
        <Button variant="outline" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Cargando temas</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Botón para alternar entre claro y oscuro */}
      <Button 
        variant="outline" 
        size="icon"
        onClick={toggleLightDark}
        title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        <div className="relative w-[1.2rem] h-[1.2rem]">
          <Sun className="absolute inset-0 h-full w-full rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute inset-0 h-full w-full rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </div>
        <span className="sr-only">Alternar modo claro/oscuro</span>
      </Button>
      
      {/* Botón para seleccionar temas personalizados */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className={customTheme ? "border-primary" : ""}
            title="Seleccionar tema personalizado"
          >
            <Palette className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Selector de tema personalizado</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Temas personalizados</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => applyTheme("system")}
            className="flex justify-between items-center"
          >
            <div className="flex items-center">
              <ThemePalette colors={basicThemes.find(t => t.value === "system")?.colors} />
              <span>Predeterminado (Sistema)</span>
            </div>
            {!customTheme && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
          {customThemes.map((themeOption) => (
            <DropdownMenuItem 
              key={themeOption.value}
              onClick={() => applyTheme(themeOption.value)}
              className="flex justify-between items-center"
            >
              <div className="flex items-center">
                <ThemePalette colors={themeOption.colors} />
                <span>{themeOption.name}</span>
              </div>
              {customTheme === themeOption.value && (
                <span className="text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>    
  );
}