import React, { useState } from "react";

const Testimonials = React.memo(function Testimonials({ t }) {
  const [idx, setIdx] = useState(1);

  return (
    <section
      id="reviews"
      style={{
        padding: "100px 24px",
        background: "#FAF6F0",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>

        {/* Section label */}
        <p style={{
          fontFamily: "'Barlow Semi Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: "#C9972A",
          marginBottom: 14
        }}>
          {t.testimonialSub}
        </p>

        {/* Section title */}
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 4.5vw, 46px)",
          fontWeight: 700,
          color: "#3D2B1F",
          lineHeight: 1.15,
          marginBottom: 56
        }}>
          {t.testimonialTitle}
        </h2>

        {/* Google Maps Rating Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 24,
          background: "#fff",
          border: "1.5px solid #E8DDD0",
          padding: "20px 36px",
          marginBottom: 52
        }}>
          <div style={{ textAlign: "left" }}>
            <p style={{
              fontFamily: "'Barlow Semi Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#8A7060",
              marginBottom: 4
            }}>
              Google Maps
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 40,
                fontWeight: 700,
                color: "#3D2B1F",
                lineHeight: 1
              }}>
                4.8
              </span>
              <div>
                <div style={{ color: "#C9972A", fontSize: 14, letterSpacing: 2, lineHeight: 1.3 }}>
                  {"★★★★★"}
                </div>
                <p style={{
                  fontFamily: "'Barlow Semi Condensed', sans-serif",
                  fontSize: 11,
                  color: "#8A7060",
                  letterSpacing: "0.08em",
                  whiteSpace: "nowrap"
                }}>
                  100+ reviews
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Review Card — all reviews share one grid cell, so the card height
            stays fixed at the tallest review and the dots below never shift */}
        <div style={{ display: "grid", marginBottom: 28 }}>
          {t.reviews.map((r, i) => (
            <div
              key={i}
              aria-hidden={i !== idx}
              style={{
                gridArea: "1 / 1",
                background: "#fff",
                border: "1.5px solid #E8DDD0",
                padding: "26px 48px",
                position: "relative",
                opacity: i === idx ? 1 : 0,
                pointerEvents: i === idx ? "auto" : "none",
                transition: "opacity 0.3s ease"
              }}
            >
              {/* Opening quote mark */}
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 56,
                lineHeight: 0.6,
                color: "#E8DDD0",
                marginBottom: 12,
                textAlign: "left"
              }}>
                "
              </div>

              {/* Stars */}
              <div style={{ marginBottom: 14, color: "#C9972A", fontSize: 15, letterSpacing: 3 }}>
                {"★".repeat(r.stars)}
              </div>

              {/* Review text */}
              <p style={{
                fontFamily: "'Barlow Semi Condensed', sans-serif",
                fontStyle: "italic",
                fontSize: "clamp(16px, 2vw, 19px)",
                lineHeight: 1.55,
                color: "#2C1A0E",
                marginBottom: 22
              }}>
                {r.text}
              </p>

              {/* Reviewer */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12
              }}>
                <div style={{ width: 32, height: 1, background: "#C9972A" }} />
                <div>
                  <p style={{
                    fontFamily: "'Barlow Semi Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#3D2B1F"
                  }}>
                    {r.name}
                  </p>
                  <p style={{
                    fontFamily: "'Barlow Semi Condensed', sans-serif",
                    fontSize: 11,
                    color: "#8A7060",
                    letterSpacing: "0.08em",
                    marginTop: 3
                  }}>
                    {r.date}
                  </p>
                </div>
                <div style={{ width: 32, height: 1, background: "#C9972A" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40 }}>
          {t.reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 28 : 8,
                height: 8,
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background: i === idx ? "#C9972A" : "#E8DDD0",
                transition: "all 0.3s ease",
                padding: 0
              }}
            />
          ))}
        </div>

        {/* Read More Reviews */}
        <a
          href="https://maps.app.goo.gl/LaRvUkWyq7bKAcDt5"
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: "'Barlow Semi Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#3D2B1F",
            textDecoration: "none",
            borderBottom: "1px solid #C9972A",
            paddingBottom: 3,
            transition: "color 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#C9972A"}
          onMouseLeave={e => e.currentTarget.style.color = "#3D2B1F"}
        >
          Read More Reviews
        </a>

      </div>
    </section>
  );
});

export default Testimonials;
