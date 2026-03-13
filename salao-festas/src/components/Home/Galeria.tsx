function Galeria() {

  const imagens = [

    "/foto1.jpg",
    "/foto2.jpg",
    "/foto3.jpg",
    "/foto4.jpg"

  ]

  return (

    <section className="section">

      <h2>Galeria</h2>

      <div className="grid">

        {imagens.map((img, index) => (

          <img
            key={index}
            src={img}
            className="img-200"
            alt="Foto do salão"
          />

        ))}

      </div>

    </section>

  )
}

export default Galeria
