"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function UserComments() {
  const t = useTranslations("testimonials");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      name: t.raw("items.0.name"),
      feedback: t.raw("items.0.feedback"),
      avatar: t.raw("items.0.avatar")
    },
    {
      name: t.raw("items.1.name"),
      feedback: t.raw("items.1.feedback"),
      avatar: t.raw("items.1.avatar")
    },
    {
      name: t.raw("items.2.name"),
      feedback: t.raw("items.2.feedback"),
      avatar: t.raw("items.2.avatar")
    },
    {
      name: t.raw("items.3.name"),
      feedback: t.raw("items.3.feedback"),
      avatar: t.raw("items.3.avatar")
    },
    {
      name: t.raw("items.4.name"),
      feedback: t.raw("items.4.feedback"),
      avatar: t.raw("items.4.avatar")
    }
  ];

  const nextTestimonial = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, nextTestimonial]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <section className="py-20 bg-[#faf9f5]" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto relative">
          {/* Main Testimonial Display */}
          <div className="relative bg-[#faf9f5] rounded-2xl shadow-lg p-8 lg:p-12">
            {/* Quote Icon */}
            <div className="absolute top-6 left-6 text-primary/20">
              <Quote className="w-12 h-12 lg:w-16 lg:h-16" />
            </div>

            {/* Testimonial Content */}
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Image
                    src={testimonials[currentIndex].avatar}
                    alt={testimonials[currentIndex].name}
                    width={96}
                    height={96}
                    className="w-20 h-20 lg:w-24 lg:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <blockquote className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-6 italic">
                    &quot;{testimonials[currentIndex].feedback}&quot;
                  </blockquote>
                  <cite className="text-foreground font-semibold text-lg not-italic">
                    {testimonials[currentIndex].name}
                  </cite>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-6 bg-white rounded-full p-2 lg:p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-6 bg-white rounded-full p-2 lg:p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToTestimonial(index)}
              className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary ${
                index === currentIndex
                  ? "w-8 h-2 bg-primary"
                  : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Thumbnail Preview */}
        <div className="flex justify-center gap-4 mt-8">
          {testimonials.map((testimonial, index) => (
            <button
              key={index}
              onClick={() => goToTestimonial(index)}
              className={`transition-all duration-300 rounded-full overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                index === currentIndex
                  ? "border-primary scale-110 shadow-lg"
                  : "border-transparent hover:border-gray-300"
              }`}
              aria-label={`View testimonial from ${testimonial.name}`}
            >
              <Image
                src={testimonial.avatar}
                alt={testimonial.name}
                width={56}
                height={56}
                className="w-12 h-12 lg:w-14 lg:h-14 object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}