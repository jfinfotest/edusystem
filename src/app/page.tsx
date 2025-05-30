"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";


import { Brain, BarChart3, Book, PenTool, LineChart, Clock, ArrowRight, Shield, GraduationCap, Code, CheckCircle } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Marquee } from "@/components/magicui/marquee";
import { CardStack } from "@/components/ui/card-stack";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cards = [
    {
      id: 1,
      name: "Evaluaciones Personalizadas",
      designation: "Adaptadas a cada curso",
      content: (
        <div className="flex flex-col gap-2">
          <Book className="w-8 h-8 text-purple-500" />
          <h3 className="text-lg font-bold">Evaluaciones Personalizadas</h3>
          <p>Evaluaciones diseñadas específicamente para cada materia y nivel académico.</p>
        </div>
      ),
    },
    {
      id: 2,
      name: "Retroalimentación Instantánea",
      designation: "Resultados inmediatos",
      content: (
        <div className="flex flex-col gap-2">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <h3 className="text-lg font-bold">Retroalimentación Instantánea</h3>
          <p>Recibe resultados y comentarios detallados inmediatamente después de cada evaluación.</p>
        </div>
      ),
    },
    {
      id: 3,
      name: "Análisis de Desempeño",
      designation: "Seguimiento detallado",
      content: (
        <div className="flex flex-col gap-2">
          <LineChart className="w-8 h-8 text-blue-500" />
          <h3 className="text-lg font-bold">Análisis de Desempeño</h3>
          <p>Visualiza tu progreso y áreas de mejora con análisis detallados.</p>
        </div>
      ),
    },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 dark:from-background dark:to-black/50">
      <header className="flex justify-between items-center p-4 md:p-6 h-16 border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="flex items-center gap-2 glow-effect">
          <PenTool className="h-6 w-6 text-primary blur-effect" />
          <span className="font-bold text-lg">SEIA</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-24 space-y-24">
        <section className="flex flex-col md:flex-row items-center justify-between gap-12 fade-in">
          <div className="flex-1 space-y-6 pl-0 md:pl-10">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2 animate-pulse">
              Plataforma de Evaluaciones Académicas
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Realiza tus <span className="text-primary glow-effect">Evaluaciones</span> en Línea
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Accede a tus evaluaciones de forma sencilla y recibe retroalimentación inmediata. Solo necesitas el código proporcionado por tu profesor.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" className="rounded-full px-8 blur-effect group" asChild>
                <a href="/student" className="flex items-center gap-2">
                  Comenzar Evaluación
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
          </div>
          <div className="flex-1 relative h-[400px] w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-3xl blur-3xl opacity-70 animate-pulse"></div>
            <div className="relative h-full w-full flex items-center justify-center">
              <CardStack items={cards} />
            </div>
          </div>
        </section>

        <section className="py-12 bg-muted/50 -mx-4 px-4 rounded-xl backdrop-blur-sm card-hover">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 glow-effect">Beneficios</h2>
          <Marquee className="py-4">
            {[
              { icon: <Clock className="h-6 w-6 text-primary" />, text: "Evaluaciones a Tu Ritmo" },
              { icon: <CheckCircle className="h-6 w-6 text-green-500" />, text: "Resultados Inmediatos" },
              { icon: <Brain className="h-6 w-6 text-purple-500" />, text: "Retroalimentación IA" },
              { icon: <BarChart3 className="h-6 w-6 text-blue-500" />, text: "Análisis Detallado" },
              { icon: <Shield className="h-6 w-6 text-red-500" />, text: "Ambiente Seguro" },
              { icon: <GraduationCap className="h-6 w-6 text-yellow-500" />, text: "Apoyo Docente" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-background/80 rounded-full px-6 py-3 border border-border shadow-md mx-2 card-hover blur-effect hover:scale-105 transition-transform"
              >
                {item.icon}
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </Marquee>
        </section>

        <section className="py-16 fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Proceso de <span className="text-primary">Evaluación</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              {
                step: "01",
                title: "Ingresa tu Código",
                description: "Introduce el código único proporcionado por tu profesor para acceder a la evaluación.",
                icon: <Code className="h-10 w-10 text-primary" />
              },
              {
                step: "02",
                title: "Realiza la Evaluación",
                description: "Responde las preguntas con tranquilidad. El sistema guarda tu progreso automáticamente.",
                icon: <PenTool className="h-10 w-10 text-blue-500" />
              },
              {
                step: "03",
                title: "Recibe tus Resultados",
                description: "Obtén tu calificación y retroalimentación detallada al instante.",
                icon: <CheckCircle className="h-10 w-10 text-green-500" />
              }
            ].map((step, index) => (
              <div key={index} className="relative p-6 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 card-hover glow-effect">
                <div className="absolute -top-4 -left-4 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold">
                  {step.step}
                </div>
                <div className="pt-6">
                  {step.icon}
                  <h3 className="text-xl font-bold mt-4 mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 px-8 bg-primary/10 rounded-3xl text-center space-y-8 fade-in">
          <h2 className="text-3xl md:text-4xl font-bold">¿Listo para tu evaluación?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No pierdas más tiempo. Ingresa tu código y comienza tu evaluación ahora.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button size="lg" className="rounded-full px-8 blur-effect" asChild>
              <a href="/student">Comenzar Ahora</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8 mt-12 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 glow-effect mb-4">
            <PenTool className="h-6 w-6 text-primary blur-effect" />
            <span className="font-bold text-xl">SEIA</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Sistema de Evaluación Inteligente Académica. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
