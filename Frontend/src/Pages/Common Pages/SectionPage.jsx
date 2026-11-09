
import { useParams } from 'react-router-dom'

function SectionPage() {
  const { section } = useParams()

  const title = section
    ? section.charAt(0).toUpperCase() + section.slice(1)
    : 'Dashboard'

  return (
    <section className="dashboard-content">
      <h2>{title}</h2>
      <p>Welcome to the {title} section.</p>
    </section>
  )
}

export default SectionPage
