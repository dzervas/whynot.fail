import React, { Component } from 'react';
import Nav from './components/Nav.jsx';
import List from './components/List.jsx';
import Post from './components/Post.jsx';
import { HashLink as Link } from "react-router-hash-link";
import {
  BrowserRouter as Router,
  Route,
  Switch
} from "react-router-dom";

import _Favicon from './static/img/favicon.ico';
import _Logo from './static/img/logo.png';

class App extends Component{
	constructor(props) {
		super(props);
		this.state = {
			author: "DZervas",
			title: "WhyNot.Fail",
			description: "Cause when you fail, somebody has to laugh at you",
			github: "https://github.com/dzervas/whynot.fail",

			nav_items: [
				{ name: "Home", url: "/" },
				{ name: "About", url: "/about" },
				{ name: "Webring", url: "https://webring.stavros.io/", sub: [
					{ name: "Previous", url: "https://webring.stavros.io/prev" },
					{ name: "Random", url: "https://webring.stavros.io/random" },
					{ name: "Next", url: "https://webring.stavros.io/next" },
				] },
			],
			posts: [
				{
					date: "26 January 2021",
					title: "Dry your filaments in the drawer",
					summary: "This is a weekend project to keep your filaments safe & dry. It’s very easy to rebuild and adapt to your needs an available spare parts.",
					image: "https://whynot.fail/img/1a4e4dbf-30ef-4196-8780-09c05f3851bc_hubf777867a41a5f9ad61a33dafd08449b_2383954_1024x1024_fit_q75_box.jpg",
					url: "/factory/filament-drawer",
					tags: [ "asdf", "hello" ],
					content: "Lorem ipsum dolor sit amet",
				}
			],
		};
	}

	render(){
		document.description = this.state.description;
		return (
			<Router>
				<div className="overflow-container">
					<header className="site-header" role="banner">
						<div className="container">
							<div className="title-info">
								<div className="site-title">
									<Link to="/">
										<img className="header-logo" src="/logo.png" />
									</Link>
								</div>
							</div>

							<button className="toggle-navigation">
								<i className="fas fa-bars"></i>
							</button>

							<div className="menu-primary-tracks"></div>

							<div className="menu-container menu-primary" role="navigation">
								<p className="site-description">{ this.state.description }</p>
								<div className="menu">
									<Nav nav_items={this.state.nav_items}></Nav>
								</div>
							</div>
						</div>
					</header>

					<div className="main" role="main">
						<div className="loop-container">
							<Switch>
								<Route path="/tags/:tag" render={(props) =>
									<List author={ this.state.author } posts={ this.state.posts.filter(p => p.tags.includes(props.match.params.tag)) } />
								} />
								<Route path="/:post+" render={(props) =>
									<Post author={ this.state.author } posts={ this.state.posts } post_url={ props.match.params.post } />
								} />
								<Route path="/">
									<List author={ this.state.author } posts={ this.state.posts } />
								</Route>
							</Switch>
						</div>
					</div>

					<footer className="site-footer" role="contentinfo">
						<h1><Link to="/">{ this.state.title }</Link></h1>
						<p className="site-description">{ this.state.description }</p>

						<ul className="social-media-icons">
							<li>
								<a href={ this.state.github } className="github" target="_blank">
									<i className="fab fa-github" title="github"></i>
								</a>
							</li>
						</ul>

						<div className="design-credit">
							<p>Nederburg Hugo Theme by <a target="_blank" href="https://appernetic.io">Appernetic</a>, ported by <a target="_blank" href="https://dzervas.gr">DZervas</a></p>
							<p>Supported by <a href="https://plausible.io">Plausible</a></p>
						</div>
					</footer>
				</div>
			</Router>
		)
	}
}

export default App;
