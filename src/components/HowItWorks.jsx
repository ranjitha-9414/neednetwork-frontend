function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: '🔍',
      title: 'Find what you need',
      description:
        'Browse available resources shared by individuals, volunteers, and NGOs.',
    },
    {
      number: '02',
      icon: '📝',
      title: 'Send a request',
      description:
        'Request the resource and connect with the person offering it.',
    },
    {
      number: '03',
      icon: '🤝',
      title: 'Receive support',
      description:
        'Coordinate with the resource owner and get the help you need.',
    },
  ]

  return (
    <section id="how-it-works" className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="font-semibold text-amber-500">SIMPLE & MEANINGFUL</p>

          <h2 className="mt-2 text-3xl font-bold text-[#145A46]">
            How NeedNetwork works
          </h2>

          <p className="mt-4 text-gray-600">
            Getting help and helping others is simple.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="rounded-2xl bg-[#E8F5EF] p-8">
              <div className="flex items-center justify-between">
                <span className="text-4xl">{step.icon}</span>
                <span className="text-3xl font-bold text-green-200">
                  {step.number}
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold text-[#145A46]">
                {step.title}
              </h3>

              <p className="mt-3 leading-7 text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks