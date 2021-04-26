import React, { Component } from "react";
import { HashLink as Link } from "react-router-hash-link";

export default class List extends Component {
	render() {
		var posts = [];
		console.log(this.props)

		for (const [index, value] of this.props.posts.entries()) {
			var class_string = "post type-post status-publish format-standard hentry excerpt zoom full-without-featured"
			var image = null;

			if ("image" in value) {
				class_string += " has-post-thumbnail category-design tag-memories tag-normal-post tag-standard-2"
				if (index % 2) {
					class_string += " even";
				} else {
					class_string += " odd";
				}

				image = (
					<Link className="featured-image-link" to={ value.url }>
						<div className="featured-image lazy lazy-bg-image" data-background={ value.image }></div>
					</Link>
				);
			} else {
				class_string += " category-standard category-travel odd"
			}

			var author = this.props.author;
			if ("author" in value) {
				author = value.author;
			}

			posts.push(
				<div key={ index } className={ class_string }>
					<div className="excerpt-container">
						<div className="excerpt-meta">
							<span className="date">{ Intl.DateTimeFormat("en-GB", {
								year: "2-digit",
								month: "long",
								day: "numeric",
							}).format(new Date(value.date)) }</span>
							<span> / </span>
							<span className="author">{ author }</span>
						</div>

						<div className='excerpt-header'>
							<h2 className='excerpt-title'>
								<Link to={ value.url }>{ value.title }</Link>
							</h2>
						</div>

						<div className='excerpt-content'>
							<article>
								{ value.summary }
								<div className="more-link-wrapper">
									<Link className="more-link" to={ value.url }>Read the post</Link>
								</div>
							</article>
						</div>
					</div>
				</div>
			);
		}

		return posts
	}
}
