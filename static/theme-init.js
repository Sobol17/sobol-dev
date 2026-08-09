// Runs before paint so a dark-theme visitor never sees a white flash.
// External file, not inline: the CSP allows scripts from 'self' only.
try {
	if (localStorage.getItem('sd-theme') === 'dark') {
		document.documentElement.classList.add('dark');
	}
} catch {
	// Private mode denies storage access. Light theme is the default anyway.
}
