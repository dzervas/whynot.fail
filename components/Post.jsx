import React, { Component } from "react";
import { useParams } from "react-router";
import { HashLink as Link } from "react-router-hash-link";

export default class Post extends Component {
	render() {

		console.log(this);
		// var posts = [];
		var post = this.props.posts.find(p => p.url == "/" + this.props.post_url);

		var class_string = "post type-post status-publish format-standard hentry entry excerpt-1 full-without-featured"
		var image = null;

		if ("image" in post) {
			class_string += " has-post-thumbnail category-design tag-memories tag-normal-post tag-standard-2"

			image = (
				<div className="featured-image lazy lazy-bg-image" data-background={ post.image }></div>
			);
		} else {
			class_string += " category-standard category-travel"
		}

		var author = this.props.author;
		if ("author" in post) {
			author = post.author;
		}

		var build_status = "unknown";
		if ("build_status" in post) {
			build_status = post.build_status;
		}

		var build_color = "lightgray";
		if (build_status === "passing") {
			build_color = "brightgreen";
		} else if (build_status === "failing") {
			build_color = "red";
		}

		var tags = [];
		for (const [index, value] of post.tags.entries()) {
			tags.push(
				<Link key={index} to={"/tags/" + value}>{value}</Link>
			);
		}

		return (
			<div className={ class_string }>
				<div className="entry-meta">
					<span className="date">{ Intl.DateTimeFormat("en-GB", {
						year: "2-digit",
						month: "long",
						day: "numeric",
					}).format(new Date(post.date)) }</span>
					<span> / </span>
					<span className="author">{ author }</span>
				</div>

				<div className='entry-header'>
					<h1 className='entry-title'>{ post.title }</h1>
				</div>

				<div className='entry-container'>
					<div className="entry-content">
						<article>
							{ post.content }
						</article>
					</div>
					<div className='entry-meta-bottom'>
						<div className="entry-tags">
							<img src={ "https://img.shields.io/badge/build-" + build_status + "-" + build_color }/>
						</div>

						<div className="entry-tags">
							<p>
								<span>Tags</span>
								{tags}
							</p>
						</div>
					</div>
				</div>
			</div>
		)
	}
}
