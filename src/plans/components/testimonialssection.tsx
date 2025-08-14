import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Maria Silva",
    role: "Empreendedora",
    content: "O OneDrip transformou completamente a gestão do meu negócio. Agora consigo acompanhar todos os orçamentos e vendas de forma organizada e profissional.",
    rating: 5
  },
  {
    id: 2,
    name: "João Santos",
    role: "Consultor",
    content: "A facilidade de criar orçamentos e a integração com WhatsApp me poupam horas de trabalho. Recomendo para qualquer profissional que queira se destacar.",
    rating: 5
  },
  {
    id: 3,
    name: "Ana Costa",
    role: "Freelancer",
    content: "Desde que comecei a usar o OneDrip, minha taxa de conversão de orçamentos aumentou significativamente. A plataforma é intuitiva e muito eficiente.",
    rating: 5
  }
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`w-4 h-4 ${
            index < rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubra como o OneDrip está transformando a gestão de negócios de profissionais em todo o Brasil
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                
                <StarRating rating={testimonial.rating} />
                
                <blockquote className="mt-4 text-gray-700 italic leading-relaxed">
                  "{testimonial.content}"
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-md">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
                >
                  {String.fromCharCode(65 + index)}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              +500 profissionais confiam no OneDrip
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;