export default (generator) => {
	return (description, callback) => {
		it(description, () => {
			callback(generator.next().value)
		})
	}
}
