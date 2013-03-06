Please see http://drupal.org/node/1652740 for updated information.

The text below is outdated and needs updating.

SCALD OVERVIEW DOCUMENTATION
================================================================================

Scald Core Version: 0.1
Documentation Updated: 2009-03-13

Contents
--------
1      Conventions
2      What is Scald?
2.1    Content
2.2    Attribution
2.3    Licensing
2.4    Distribution
2.5    Input

3.     Technical Overview
3.1    Scald Architecture
3.2.1  Atoms
3.2.2  Composites
3.2.3  Providers
3.2.4  Types
3.2.5  Contexts
3.2.6  Actions
3.2.7  Transcoders
3.2.8  Relationships
3.2.9  Scald Configuration Object (SCO)
3.2.10 Scald Atom Shorthand (SAS) Input Filter
3.3    Scald Core API
3.4    Scald Provider API




1 CONVENTIONS
==============

  The word "slug" is frequently used in these docs.  The intended reference is
not to the gastropods but rather to a short (and contextually unique) text
string used for identifying something.  This use of the term originates in the
publishing world (specifically periodicals) where a place-holder title is often
used before an article is finished.  Scald makes heavy use of slugs as internal
identifiers.  Using slugs allows for logical code to be written which does not
rely on arbitrary numerical IDs which require both additional registration and
lookup.

NOTE: Slugs are used as keys in database tables, associative arrays, as keys to
look for in regular expressions and as portions of urls. As such, slugs can only
contain alphanumeric characters, underscores (_) or dashes (-). So
"my-cool_slug2" is OK, but "my cool slug!" is not.  FAILURE TO PROPERLY NAME
SLUGS CAN HAVE CATOSTROPHIC RESULTS.  Slug checking is implemented as much as is
feasible, but may not be 100% fool-proof.  You have been warned :).



2 WHAT IS SCALD?
=================

  "SCALD is Content, Attribution, Licensing, & Distribution".  The problem that sparked the development of Scald is obvious all over the web.  When I (the end-user) want to post something online I first must figure out what *type* of thing I'm posting.  If I am writing something for my personal blog about my vacation last weekend, I'll open up Blogger and start writing.  But then I realize that I have a video which I want to include in my post.  So I open up YouTube, check to see if the video format that I have my video in is compatible with YouTube, upload my video, copy the embed code, paste it into Blogger and then test my post to see if the video actually embedded properly.  THEN, I can get back to writing my post -- only to realize that the photos I took on the trip would be good to include too, so I open up Flickr...
  As the narrative above highlights, the web currently has "silos" of media which are exposed to the end-user.  I shouldn't have to care that YouTube is where videos live.  Or which codecs YouTube supports.  I should be able to just upload my video directly in Blogger, pay no attention to where its being stored and put it in my post.  Similarly, if the video is already online, I shouldn't have to figure out if the embed code from Vimeo is different than the one on YouTube.  I should just be able to select my video and put it in my blog post -- ideally from right within Blogger.  And this should apply to audio, images, and video -- all regardless of the source (my hard drive or someone else's website).
  To make things worse, we have not even begun to consider the licensing implications, we're just discussing a format usability problem.  The average user has no concept of the intracacies of "fair use" or "attribution share-alike".  Despite all the efforts by the Creative Commons folks, these are concepts which are very difficult for those who don't deal with such issues daily to understand.  What I want to know is "how do I get that video in my blog post?".  There should be a mechanism which distills the licensing issues down to "can I use it or not?"  Even better, the content which I am not allowed to use in that way shouldn't even be exposed in the interface.  The related problem of "how do I let other people use my stuff without giving it away" is something that casual content creators may or may not consider.

  So again, SCALD is Content, Attribution, Licensing, & Distribution.  The core concepts of Scald (to be discussed here) are Scald Atoms & Composites, the Scald Unified Type system, Display Contexts, support for an arbitrary number of formats through the Scald Provider API, flexibility in input methods (including full and implementation-agnostic support for WYSIWYG), proper handling of Licensing and Attribution, and finally, stitching it all together with the common thread of social capabilities.



2.1 CONTENT
-----------

  Scald strives to be "content-type agnostic".  This creates some difficulties in language when discussing Scald because one cannot say "media" or "multimedia" because Scald can be extended to handle anything -- audio, video, images, plain text, files, code, even interactive elements like an embedded Flash game.  "Content" is used as a generic term to describe any and all of these things and ultimately represents what it is that the end user wants to publish online (which is usually some combination of the different elements listed above).
  Scald is content-type agnostic in two different ways.  First, only the "colloquial" type (audio, video, code, etc.) is presented to the user while the format type (PNG, JPEG, AVI, MPEG) is irrelevent.  Everything is distilled using the Scald Unified Type system which allows a developer to arbitrarily define a type and then further define what belongs to that type.  Since the primary use case for Scald is in (multi)media handling, the "standard" Scald Unified Types are audio, video, and images.
  The second way that Scald is content-type agnostic is that regardless of the Unified Type of a particular piece of content, it is handled in an identical fashion.  Including a video in a blog post is identical to including an image or an audio clip.  Embedding a video is no different than embedding an image.  They all have a title, an author, a thumbnail representation, and so on.
  Another key element to Scald is that each individual image, video, or audio clip is a single entity known as a Scald Atom.  The word "atom" is intentionally chosen to imply that it cannot be further deconstructed.  Within Scald, whenever one references a particular image, the author, date of creation, title, description, licensing restrictions and so forth are explicitly included and available.  In order to fully and effectively exploit the classification of content, two images should not be combined into a single Scald Atom.
  If two images are closely related, perhaps they belong together in a Scald Composite.  Loosely borrowing a metaphor from the physical world, a Scald Composite is made up of two or more Scald Atoms that are explicitly connected in some way.  The most common mechanism for creating a Scald Composite is through the inclusion of a Scald Atom in a text post.  Note that a single Atom can belong to multiple different Composites which enables effective re-use of the original content.  The goal is to avoid having an end user upload the same content twice.  In an effort to maintain a single mechanism for interacting with content both at the developer *and* end-user level, a Scald Composite can be manipulated in most of the same ways that a Scald Atom is (the Unified Type of a Composite is simply "composite", though the Unified Types of the constituent Atoms are available).
  In summary, a Scald Atom is a singular piece of content (often media) which has a standard set of metadata associated with it, including its Scald Unified Type which is used to classify the Atom within Scald.  One or more Atoms can be combined into multiple different Scald Composites which in turn can be interacted with as single entities.



2.2 ATTRIBUTION
---------------

  Given that one of the primary goals of Scald is easy re-use of content, the proper tracking and acknowledgement of the original author of an Atom becomes very important.  As mentioned above, when working within Scald either as a developer or as an end-user, it is impossible to separate the author from a Scald Atom.  This means that upon display of an Atom if attribution is one of the terms of the license, the original author's name will be displayed in addition to the actual content of the Atom.
  Another important benefit of careful tracking of authorship throughout Scald is that despite an individual Atom being used in dozens of Composites and re-used both on and off the site, the original author can keep track of where his or her work has gone.  When operating within a single site using Scald it is obvious to see how this can be handled, but allowing for such tracking off-site is a different issue entirely.  This is covered in more detail in the "Distribution" section, but the key point is to make the interface for including a Scald Atom (or Composite) in an external site so simple and convenient that there is little incentive for an end-user to go to the trouble of extracting the original content from its Atomic context of authorship.
  The other expected benefit of careful management of authorship is the ability for end-users to find other content by favorite content creators.  When looking at a blog post with a nice picture of a cat, one can easily determine whether the author of the blog post took that picture and if not, where to find more photos from the same original photographer -- information which is often lost if the blog post author does not bother to attribute the photo (or cannot because the information was lacking at the original source).
  An obvious issue when considering attribution is the posting of content by users who are not the original author.  Scald makes provision for such an instance by allowing for authors who are not users of the site where Scald is in use and by encouraging the inclusion of such an option in the interface.



2.3 LICENSING
-------------

  The obvious complement to the attribution components discussd above is the Licensing component of Scald.  Scald makes use of a fine-grained permissions model to allow for the implementation of a variety of different licenses.  With a particular eye toward the standard suite of Creative Commons Licenses, Scald defines various actions that can be taken regarding a given Atom.  Combining actions such as editing, downloading the original source content, re-using content with or without attribution, and granting additional re-use by others, Scald allows for the definition of application-specific licenses.
  Revokation of a particular license or permission is relatively painless through Scald.  Since all re-use is registered centrally within Scald, the Atom in question can be very simply "blanked out" and an appropriate notice can take its place.  This is clearly and important element to include -- in tandem with the attribution of content to non-users -- in today's media climate.  Any site which relies on user-submitted content needs to consider what happens when a copyright claim is leveled against them and having the capability to revoke inclusion permissions built in from the start is an excellent defense.



2.4 DISTRIBUTION
----------------

  The distribution piece refers to both local distribution as well as remote distribution.  Locally, the most important element of Scald is the idea of Display Contexts.  In an effort to enable good re-use of content, a given Scald Atom can be displayed in an arbitrary number of Display Contexts which control things like the space consumed on the page, the amount of non-mandatory metadata that is included and so on.  The mechanism for determining the Display Context for a given instance of displaying an Atom (or a Composite) is multi-tiered.  Each Unified Type has a fallback Display Context which ensures that a bare minimum of essential elements are displayed for any given Atom of that Type.
  Distribution beyond the confines of a given site where Scald is resident is handled through a variety of means including both an end-user-focused "embed code" mechanism as well as API endpoints enabling external developers to interact with content within Scald while gaining all the benefits and abiding by all of the restrictions that content within Scald enjoys.
  Author tracking, licensing restrictions, "similar content", and easy re-use are all benefits to making use of Scald's distribution both internally and externally.



2.5 INPUT
---------

  One piece of the big picture which is notably absent in the discussion above is the mechanism of input.  This is completely intentional -- Scald is explicitly a back-end management system which does not have any strong "opinions" about how the data reaches it.  A careful implementation of a WYSIWYG editor combined with "edit" and "display inside a post" Display Contexts is an obvious choice to fill out the "simple editing" user story from above, but it is by no means the only mechanism and Scald makes no promises or prohibitions about how input is recieved.  Using Scald as a way to locally manage content from a user's YouTube or Flickr stream is one possibility which requires no local input mechanism for the actual media, just a way of allowing local users to post it.




3 TECHNICAL OVERVIEW
====================

3.2 COMPONENTS
--------------

3.2.1 SCALD ATOMS

  Scald Atoms are


3.2.2 SCALD COMPOSITES

  Note: Composites are no longer part of Scald in 7.x branches.

  Scald Composites are identical to Scald Atoms in every way except that instead
of representing a single entity (e.g. an image), they represent a collection of
other Scald Atoms.  The typical Scald Composite has one or more textarea fields
which in addition to having text (or rich text), contain Scald Atoms.  The format
for Scald Atom Shorthand (SAS) is as follows:

[scald=SID]
[scald=SID:context-slug]
[scald=SID:context-slug contextoptions]

This is how Scalt Atoms are noted in a string of text which includes them.  Note
that the Scald Context specified in this way can be overridden when the Scald
Atom is later displayed as part of the Scald Composite.

  A Scald Composite could also be made up of several individual fields each of
which specifies a Scald Atom.


3.2.5 CONTEXTS

  Scald Contexts which are of render language XHTML and are intended to be used as a potential input representation (for instance if they are to be the editor representation of an Atom when using Scald in combination with DnD and an RTE), they *must* provide three classes to the outer-most XHTML element or the Atom will not be recognized as an Atom.  Those classes are: scald-id-SID where SID is the Scald ID of the Atom that this is a rendering of, scald-context-contextslug where contextslug is the Scald Context slug for the Scald Context that the Atom is rendered in.  This is probably not true anymore; the Scald Atom will probably need to be wrapped in <!-- scald=SID:context-slug context-options -->...<!-- end scald=SID -->


3.2.6 ACTIONS

  Scald Actions are defined arbitrarily.  The possible Actions that a given User can perform on a given Atom are determined by Action bitstrings.  Each action has a position (arbitrarily-defined) in the bitstring.  Due to PHP limitations, there is an upper bound of 31 Actions.  The high bit in any actions Bitstring is the "admin bit" which, when set, means that the comparison is "OR", rather than "AND".  Typically a user's Action bitstring (which is an OR-ing of all the Role Action bitstrings which the User is a part of) is AND-ed with the Atom's Action bitstring.  However, if the Admin Bit is set, then a user's Action bitstring is *OR*-ed with the Atom's Action bitstring.  Careful assignment of Action bitstrings to roles and roles to users should result in a fairly complete set of possibilities.


3.2.10 SCALD ATOM SHORTHAND (SAS) INPUT FILTER

  Scald Core implements an input filter to allow for the inclusion of Scald
Atoms in textareas in Drupal.  When defining an input format, care should be
taken to ensure that the rendered Scald Atoms (probably rendered in XHTML) are
not subsequently processed into oblivion by other input filters.  In other
words, make sure that the Scald Atom Shorthand (SAS) Filter is *after* filters
which strip tags.
