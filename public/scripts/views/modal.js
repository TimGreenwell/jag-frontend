// /**
//  * @file Configuration/settings menu for Authoring Tool.
//  *
//  * @author cwilber
//  * @copyright Copyright © 2021 IHMC, all rights reserved.
//  * @version 0.23
//  */
//
// customElements.define('jag-modal', class extends HTMLElement {
//
//     constructor() {
//         super();
//         const modal = document.querySelector(".modal");
//         const trigger = document.querySelector(".trigger");
//         const closeButton = document.querySelector(".close-button");
//
//         const $outerDiv = document.createElement("div");
//         $outerDiv.classList.add("modal");
//         this.appendChild($outerDiv);
//
//         const $innerDiv = document.createElement("div");
//         $innerDiv.classList.add("modal-content");
//         $outerDiv.appendChild($innerDiv);
//
//         const $span = document.createElement("span");
//         $span.classList.add("close-button");
//         $innerDiv.appendChild($span);
//         const $h1 = document.createElement("h1");
//         $h1.innerHTML = "go me!";
//         $innerDiv.appendChild($h1);
//
//         //  $button.addEventListener("click", toggleModal);
//         $span.addEventListener("click", toggleModal);
//         window.addEventListener("click", windowOnClick);
//
//         //    const modal = document.querySelector(".modal");(outerDiv)
//         //   const trigger = document.querySelector(".trigger");(button)
//         //   const closeButton = document.querySelector(".close-button");(span)
//
//         this.toggleModal() {
//             this.$outerDiv.classList.toggle("show-modal");
//         };
//
//         function windowOnClick(event) {
//             if (event.target === $outerDiv) {
//                 toggleModal();
//             }
//         }
//     };
//
//
//     handleToggleModal(detail) {
//         this.toggleModal();
//     }
//
//
//
// });
//
// export default customElements.get('jag-modal');
//
