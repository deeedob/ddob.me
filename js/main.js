import { Application } from '@hotwired/stimulus'
import * as Turbo from '@hotwired/turbo'

import CodeMirrorController from './controllers/codemirror_controller.js'
import TimeIsNowController from './controllers/timeisnow_controller.js'
import TagFilterController from './controllers/tagfilter_controller.js'

Turbo.start()
window.Stimulus = Application.start()
window.Stimulus.register('codemirror', CodeMirrorController)
window.Stimulus.register('timeisnow', TimeIsNowController)
window.Stimulus.register('tagfilter', TagFilterController)

window.addEventListener('beforeunload', () => {
  localStorage.setItem('scrollPosition', window.scrollY)
})

window.addEventListener('DOMContentLoaded', () => {
  const scrollY = localStorage.getItem('scrollPosition')
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY))
  }
})
