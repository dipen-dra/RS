import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Heart, Globe2, ShieldCheck, Map, Users, ArrowRight } from "lucide-react";
import aboutHero from "@/assets/about-hero.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — RentalSphere" },
      {
        name: "description",
        content:
          "Why we built RentalSphere — premium car and bike rentals built for travelers who care.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax effect */}
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <img
            src={aboutHero}
            alt="Driving in the UK"
            className="w-full h-full object-cover object-center brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />
        </motion.div>

        <div className="container-page relative z-10 text-center max-w-4xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6 tracking-wide uppercase">
              <Globe2 className="h-4 w-4" /> Our Story
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight leading-tight">
              We rent vehicles <br className="hidden md:block" />
              <span className="text-white/80">we'd drive ourselves.</span>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto font-medium">
              RentalSphere started with a simple idea: renting a vehicle in the UK should feel as
              good as the trip itself. No paperwork chaos, no surprise fees, no compromises on
              quality.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container-page -mt-16 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Happy Travelers", value: "10k+" },
            { label: "Premium Vehicles", value: "120+" },
            { label: "Cities Covered", value: "15" },
            { label: "Average Rating", value: "4.9/5" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border/60 rounded-3xl p-6 text-center shadow-lg"
            >
              <div className="font-display text-3xl md:text-4xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-muted-foreground mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className="container-page py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl font-bold tracking-tight text-ink">
            What drives us forward
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            We believe that a great journey starts with a reliable ride. Here is our promise to you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Sparkles,
              title: "Premium by default",
              text: "Every vehicle in our fleet is meticulously detailed, regularly serviced, and thoroughly inspected before each and every trip.",
            },
            {
              icon: Heart,
              title: "Built with care",
              text: "We believe in honest pricing, real human support, and a flexible cancellation policy that understands travel plans change.",
            },
            {
              icon: Map,
              title: "Local at heart",
              text: "We're from the UK. We know the challenging country lanes, the rainy seasons, and the scenic routes truly worth taking.",
            },
            {
              icon: ShieldCheck,
              title: "Fully insured",
              text: "Drive with absolute peace of mind. Comprehensive insurance coverage comes standard with every rental, no hidden upsells.",
            },
            {
              icon: Users,
              title: "Community first",
              text: "We partner with local guides and mechanics across all our locations to support the beautiful communities we operate in.",
            },
            {
              icon: Globe2,
              title: "Sustainable vision",
              text: "We are actively transitioning our fleet to hybrid and fully electric vehicles to preserve the UK's pristine environments.",
            },
          ].map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-3xl border border-border/60 bg-card p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary inline-flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-ink">{v.title}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{v.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-page pb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] overflow-hidden gradient-brand p-12 md:p-20 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_70%)]" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
              Ready for your next adventure?
            </h2>
            <p className="text-white/80 text-lg mb-10">
              Join thousands of happy travelers who have explored the beauty of the UK with our
              premium vehicles.
            </p>
            <Link
              to="/cars"
              className="inline-flex h-14 px-8 items-center gap-3 rounded-full bg-white text-primary font-bold text-lg hover:scale-105 transition-transform shadow-xl"
            >
              Explore the fleet <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
