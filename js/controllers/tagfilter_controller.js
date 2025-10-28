import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button", "posts"]

  connect() {
    this.activeTags = []
    this.filterPosts()
  }

  toggle(event) {
    const btn = event.currentTarget
    const tag = btn.dataset.tag

    btn.classList.toggle("active")

    if (btn.classList.contains("active")) {
      this.activeTags.push(tag)
    } else {
      this.activeTags = this.activeTags.filter(t => t !== tag)
    }

    this.filterPosts()
  }

  filterPosts() {
    const posts = this.postsTarget.querySelectorAll("article[data-tags]")

    posts.forEach(post => {
      const tags = post.dataset.tags
        ? post.dataset.tags.split(",").map(t => t.trim())
        : []

      const show =
        this.activeTags.length === 0 || tags.some(t => this.activeTags.includes(t))

      if (show) {
        post.classList.add("fade-in")
        post.classList.remove("fade-out")
        post.style.pointerEvents = "auto"
      } else {
        post.classList.add("fade-out")
        post.classList.remove("fade-in")
        post.style.pointerEvents = "none"
      }
    })
  }
}

