<template>
  <section class="home-hero d-flex flex-column justify-content-center align-items-center text-center">
    <div class="content">
      <h1 class="hero-title mb-3">Youth Wellbeing Platform</h1>
      <p class="hero-quote fst-italic mb-4">
        “Empowering the next generation to flourish — together in mind, body & community.”
      </p>
      <p class="hero-about mx-auto">
        Our mission is to support youth mental health through accessible programs, trusted resources, and a connected community. 
        Whether you’re seeking guidance, looking for support, or wanting to explore wellbeing strategies — this platform is here for you.
      </p>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Nunito:wght@400;500&display=swap');

.home-hero {
  min-height: calc(100vh - 140px); /* fit viewport around navbar + footer */
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 50%, #fbc2eb 100%);
  color: #333;
}

.content {
  max-width: 900px;
  padding: 2rem;
}

.hero-title {
  font-family: 'Poppins', sans-serif;
  font-size: clamp(2.5rem, 6vw, 3.5rem);
  font-weight: 700;
  color: #2c1aff;
  text-shadow: 0px 3px 6px rgba(0,0,0,0.15);
}

.hero-quote {
  font-family: 'Nunito', sans-serif;
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  color: #222;
  font-style: italic;
  line-height: 1.6;
}

.hero-about {
  font-family: 'Nunito', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: #444;
  line-height: 1.8;
  max-width: 750px;
}
</style>
