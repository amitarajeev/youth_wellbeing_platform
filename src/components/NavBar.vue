<template>
  <nav class="navbar navbar-expand-lg navbar-dark classy-nav">
    <div class="container-fluid">
      <!-- Brand -->
      <router-link to="/" class="navbar-brand">
        🌱 Youth Wellbeing
      </router-link>

      <!-- Mobile toggle -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Links -->
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <li class="nav-item">
            <router-link to="/" class="nav-link" exact-active-class="active">
              Home
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/programs" class="nav-link" exact-active-class="active">
              Programs
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/resources" class="nav-link" exact-active-class="active">
              Resources
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/reviews" class="nav-link" exact-active-class="active">
              Reviews
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/auth" class="nav-link" exact-active-class="active">
              Login
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>


<style scoped>
/* Classy gradient navbar */
.classy-nav {
  background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

/* Brand styling */
.navbar-brand {
  font-weight: bold;
  font-size: 1.3rem;
  color: #fff !important;
}

/* Nav link styles */
.nav-link {
  color: #f8f9fa !important;
  font-weight: 500;
  margin: 0 10px;
  transition: all 0.3s ease-in-out;
}

/* Hover effect */
.nav-link:hover {
  color: #ffe066 !important;
  text-shadow: 0px 0px 5px rgba(255, 224, 102, 0.7);
}

/* Active page highlight */
.nav-link.active {
  border-bottom: 2px solid #ffe066;
}

/* Fix for mobile toggler button (hamburger icon visibility) */
.navbar-toggler {
  border: none;
}
.navbar-toggler-icon {
  background-image: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='rgba%28255, 255, 255, 0.9%29' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
}
</style>
