import { gsap } from 'gsap'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      gsap
    }
  }
})

declare module '#app' {
  interface NuxtApp {
    $gsap: typeof gsap
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $gsap: typeof gsap
  }
}
