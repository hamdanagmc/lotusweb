import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'rh6f9d38',
    dataset: 'production'
  },
  studioHost: 'lotus-uae',
  deployment: {
    appId: 'mhzvxo7qln18fgu6j99nfjkh',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
