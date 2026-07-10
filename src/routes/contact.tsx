import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { submitQuery } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — RentalSphere" },
      {
        name: "description",
        content: "Get in touch with the RentalSphere team. We respond within an hour.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitQuery({ name, email, subject, message });
      if (res.success) {
        toast.success("Message sent successfully! We will get back to you soon.");
        setSubject("");
        setMessage("");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="container-page py-16 md:py-24 grid lg:grid-cols-2 gap-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-semibold text-primary uppercase tracking-wider">Contact</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Let's talk wheels.</h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          Have a question, want a custom rental, or building something exciting? We respond within
          an hour.
        </p>

        <div className="mt-10 space-y-4">
          {[
            { icon: Phone, k: "Call us", v: "+44 20 7946 0958" },
            { icon: Mail, k: "Email", v: "hello@rentalsphere.com" },
            { icon: MapPin, k: "Headquarters", v: "Soho, London, UK" },
          ].map((c) => (
            <div
              key={c.k}
              className="flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border/60"
            >
              <div className="h-11 w-11 rounded-full gradient-brand text-white inline-flex items-center justify-center">
                <c.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.k}</p>
                <p className="text-sm font-semibold text-ink">{c.v}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="rounded-3xl border border-border/60 bg-card p-8 space-y-5 h-fit"
      >
        <h2 className="font-display text-2xl font-bold">Send a message</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Name</span>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full h-12 px-4 rounded-xl bg-muted border border-border/40 focus:border-primary focus:outline-none text-sm font-medium text-ink"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-12 px-4 rounded-xl bg-muted border border-border/40 focus:border-primary focus:outline-none text-sm font-medium text-ink"
              required
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Subject</span>
          <input
            type="text"
            placeholder="How can we help?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full h-12 px-4 rounded-xl bg-muted border border-border/40 focus:border-primary focus:outline-none text-sm font-medium text-ink"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Message</span>
          <textarea
            rows={5}
            placeholder="Tell us more…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 w-full p-4 rounded-2xl bg-muted border border-border/40 focus:border-primary focus:outline-none text-sm text-ink"
            required
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-full gradient-brand text-white font-semibold inline-flex items-center justify-center shadow-[var(--shadow-glow)] hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:pointer-events-none"
        >
          {isSubmitting ? "Sending..." : "Send"} <Send className="ml-2 h-4 w-4" />
        </button>
      </motion.form>
    </section>
  );
}
