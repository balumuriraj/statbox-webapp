import { Component, Vue } from 'vue-property-decorator';
import { EventBus } from '@/events';

@Component
export default class Modal extends Vue {
  public showModal: boolean = false;

  private mounted() {
    EventBus.$on('toggleModal', () => {
      this.showModal = !this.showModal;
    });
  }
}
