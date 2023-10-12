import { defineStore } from 'pinia'
import axios, { AxiosInstance, CancelTokenStatic } from 'axios'
import { watch, ref } from 'vue'
import { GlobalStore } from '@/store/GlobalStore'
import { SessionStore } from '@/store/SessionStore'

const store = GlobalStore()
const sessionStore = SessionStore()
const base = sessionStore.getUrlRails
let controller = new AbortController();

watch(
  () => store.filter,
  () => {
    ApiStore().search()
  }
)
watch(
  () => store.sortBy,
  () => {
    ApiStore().search()
  }
)
watch(
  () => store.mixtape,
  () => {
    ApiStore().mixtapeSearch()
  }
)

export const ApiStore = defineStore({
  id: 'apiData',
  state: () => ({
    hypertexts: [],
    kernals: [],
    linkContents: [],
    sourceUrls: [],
    mixtapes: [],
  }),

  actions: {
    async initialize () {
      controller.abort()
      controller = new AbortController();


      const config = {
        headers: { Authorization: sessionStore.auth_token },
        signal: controller.signal
      }
      const params = '?sort=' + store.sortBy
      const [ linkContents ] = await Promise.all([
        axios.get(base + 'link_contents' + params, config),
      ])
      this.linkContents = linkContents.data
      this.fetchHypertexts(1),
      this.fetchKernals(1),
      this.fetchMixtapes(1)
      this.fetchSourceUrls(1)
    },
    async search () {
      controller.abort()
      controller = new AbortController();

      this.hypertexts = []
      this.linkContents = []
      this.sourceUrls = []
      this.kernals = []

      const config = {
        headers: { Authorization: sessionStore.auth_token },
        signal: controller.signal
      }
      let params = '?q=' + store.filter + '&sort=' + store.sortBy 

      try {
        const [ linkContents ] = await Promise.all([
          axios.get(base + 'link_contents' + params, config),
        ])
        this.linkContents = linkContents.data
        this.fetchSourceUrls(1)
        this.fetchKernals(1)
        this.fetchHypertexts(1)
      } catch (e) {
        console.error(e);
      }
    },
    async mixtapeSearch () {
      controller.abort()
      controller = new AbortController();
      this.kernals = []

      try {
        this.fetchKernals(1)
      } catch (e) {
        console.error(e);
      }
    },
    async fetchKernals (pageNumber: number) {
      const config = {
        headers: { Authorization: sessionStore.auth_token },
        signal: controller.signal
      }
      let params = '?q=' + store.filter + '&page=' + pageNumber + '&sort=' + store.sortBy 
      if (store.mixtape != '') { params = params + '&mixtape=' + store.mixtape }
      try {
        const kernals = await axios.get(base + 'kernals'+ params +'&q=' + store.filter, config)
        this.kernals = this.kernals.concat(kernals.data)
        
        if(this.kernals.length === store.pageSize){ 
          const keys: string[] = []
          for (let k in this.kernals[0]){
            if(k != 'signed_url' && k != 'signed_url_nail' && k != 'id' && k != 'file_path') {
              keys.push(k)
            }
          }
          store.setSortByValue(keys)
        }

        return kernals
      } catch (e) {
        console.error(e);
      }
    },
    async fetchHypertexts (pageNumber: number) {
      const config = {
        headers: { Authorization: sessionStore.auth_token },
        signal: controller.signal
      }
      let params = '?page=' + pageNumber + '&sort=' + store.sortBy + '&q=' + store.filter 

      try {
        const hypertexts = await axios.get(base + 'hypertexts'+ params, config)
        this.hypertexts = this.hypertexts.concat(hypertexts.data)
      } catch (e) {
        console.error(e);
      }
    },
    async fetchMixtapes (pageNumber: number) {
      const config = {
        headers: { Authorization:  sessionStore.auth_token },
        signal: controller.signal
      }
      let params = '?page=' + pageNumber + '&sort=' + store.sortBy + '&q=' + store.filter 
      try {
        const mixtapes = await axios.get(base + 'mixtapes'+ params, config)
        console.log('length: ' + mixtapes.data.length)
        this.mixtapes = this.mixtapes.concat(mixtapes.data)
        return mixtapes
      } catch (e) {
        console.error(e);
      }
    },
    async fetchSourceUrls (pageNumber: number) {
      const config = {
        headers: { Authorization: sessionStore.auth_token },
        signal: controller.signal
      }
      let params = '?page=' + pageNumber + '&sort=' + store.sortBy + '&q=' + store.filter 

      try {
        const sourceUrls = await axios.get(base + 'source_urls'+ params, config)
        this.sourceUrls = this.sourceUrls.concat(sourceUrls.data)
      } catch (e) {
        console.error(e);
      }
    }
  }
})
