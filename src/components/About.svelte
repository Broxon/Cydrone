<section class="section" id="O_nás">
  <div class="container" id="Kontejner_o_nás">
    <div class="has-text-centered pb-6">
      <h2 class="title is-2">O nás</h2>
      <h5 class="subtitle is-5 has-text-grey">Představení našeho týmu, který je zodpovědný za vývoj CyDrone</h5>
    </div>
    <div id="div-about">
      <div class="columns">
        <div class="column">
          <div class="columns">
            <div class="column is-3 mt-1 mr-1 ml-1" id="image">
              <figure class="image">
                <img class="is-rounded is-128x128" src="./assets/img/people/alex.png" alt="Alexandr Waage" />
              </figure>
            </div>
            <div class="column m-1 mr-0">
              <blockquote class="title is-4">"Myslím si, že potenciál našeho projektu je obrovský"</blockquote>
              <h6 class="title is-6 mb-0">Alexandr Waage</h6>
              <h6 class="is-6 mt-0">IoT & security engineer</h6>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="columns">
            <div class="column is-3 mt-1 mr-1 ml-1" id="image">
              <figure class="image">
                <img class="is-rounded is-128x128" src="./assets/img/people/bruno.png" alt="Bruno Bartůněk" />
              </figure>
            </div>
            <div class="column m-1 mr-0">
              <blockquote class="title is-4">"Díky tomuto projektu se můžu rozvíjet ve věcech, které mě baví"</blockquote>
              <h6 class="title is-6 mb-0">Bruno Bartůněk</h6>
              <h6 class="is-6 mt-0">Security & HW engineer</h6>
            </div>
          </div>
        </div>
      </div>
      <div class="columns">
        <div class="column">
          <div class="columns">
            <div class="column is-3 mt-1 mr-1 ml-1" id="image">
              <figure class="image">
                <img class="is-rounded is-128x128" src="./assets/img/people/amir.png" alt="Akrami Amir" />
              </figure>
            </div>
            <div class="column m-1 mr-0">
              <blockquote class="title is-4">"Naše řešení je naprosto unikátní oproti ostatním"</blockquote>
              <h6 class="title is-6 mb-0">Akrami Amir</h6>
              <h6 class="is-6 mt-0">HW engineer & IoT engineer</h6>
            </div>
          </div>
        </div>
        <div class="column" />
      </div>
    </div>
  </div>
</section>

<style>
  #div-about {
    background-color: #ffffff;
    opacity: 1;
    background-image: radial-gradient(rgba(7, 2, 56, 1) 0.9px, transparent 0.9px), radial-gradient(rgba(7, 2, 56, 1) 0.9px, #ffffff 0.9px);
    background-size: 36px 36px;
    background-position: 0 0, 18px 18px;
    padding-bottom: 5%;
  }

  @media only screen and (max-width: 600px) {
    .column {
      margin-top: 9em;
      margin-left: 5em;
      margin-right: 5em;
    }
  }

  @media only screen and (min-width: 600px) and (max-width: 1000px) {
    .column {
      margin-top: 9em;
    }

    #image {
      width: 35%;
    }
  }

  @media only screen and (min-width: 1000px) {
    .column {
      margin-top: 9rem;
    }
  }
</style>
