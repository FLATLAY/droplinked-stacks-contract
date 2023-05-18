export const uintValue = (clarityUint: string) => {
	return parseInt(/u([0-9]+)/.exec(clarityUint)![1])
}
