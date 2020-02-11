import React from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory,
  useParams,
} from "react-router-dom";

import './App.css';

const Component = React.Component

var phpEndpoints = '/endpoints/'
//var phpEndpoints = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' ? 'http://localhost/endpoints/' : '/endpoints/'

class App extends Component {
  constructor(props) {
    super(...arguments)
    try { var cached = JSON.parse(localStorage['listingData']) } catch (e) { }
    this.state = { listingData: cached || { } }
  }
  render() {
    return <Router>
      <HeaderFooter>
        <Switch>
          <Route exact={true} path="/:articleId([1-9]\d*)/edit"
              render={(props) => <PageArticleEdit {...props} appState={this.state}/>}></Route>
          <Route path="/:articleId([1-9]\d*)"
              render={(props) => <PageArticle {...props} appState={this.state}/>}></Route>
          <Route exact={true} path="/add"
              render={(props) => <PageArticleEdit {...props} appState={this.state}/>}></Route>
          <Route
              render={(props) => <PageListing {...props} appState={this.state}/>}></Route>
        </Switch>
      </HeaderFooter>
    </Router>
  }
} export default App;

class PageArticleEdit extends Component {
  static historyDepth = 3
  constructor(props) {
      super(props)
      this.state = { historyDepth: props.historyDepth, id: props.match.params.id }
  }
  componentDidMount() {
    initHistoryDepth(this.constructor.historyDepth)
    let appState = this.props.appState
    if (this.props.match.params.articleId)
      this.request = ajaxWave({
        url: phpEndpoints + 'fetch-one.php/' + this.props.match.params.articleId,
        callback: wave => {
          if (wave.json) {
            wave.editedTitle = wave.json.title
            wave.editedContent = wave.json.content
            this.props.appState.listingData[wave.json.id] = { id: wave.json.id, title: wave.json.title }
            localStoreOrDel('listingData', this.props.appState.listingData)
          }
          this.setState(wave)
        }
      })
    else
      this.setState({ editedTitle: '', editedContent: '', json: {} })
  }
  componentWillUnmount() {
    if (this.request) this.request.abort()
  }
  render() {
    let appState = this.props.appState
    var elements = [ ]
    elements.push(<h2>
      <BackButton fallback={'/' + (this.props.match.params.articleId || '')} historyDepth={this.props.match.params.articleId ? 3 : 2}/>
      {this.props.match.params.articleId
        ? 'Edit Article ID ' + this.props.match.params.articleId
        : 'Add new Article'}
    </h2>)

    var theTitle = this.state && this.state.json ? this.state.editedTitle : (appState.listingData[this.props.match.params.articleId] || { title: null }).title

    elements.push(<form action="javascript:" onSubmit={
          e => {
            if (this.state.saveState) return // one at a time

            this.state.saveState = 'hold'
            this.setState(this.state)

            this.request = ajaxWave({
              url: phpEndpoints + 'save-submit.php/' + (this.props.match.params.articleId || '0'),
              postdata: formData(e.target),
              callback: wave => {
                if (wave.json) {
                  this.props.appState.listingData[wave.json.id] = { id: wave.json.id, title: wave.json.title }
                  localStoreOrDel('listingData', this.props.appState.listingData)
                  this.state.saveState = 'thanks'
                  setTimeout(() => {
                    if (this.props.match.params.articleId)
                      if (sessionStorage.originPrimary < 3)
                        window.history.back()
                      else
                        this.props.history.push('/' + wave.json.id)
                    else if (sessionStorage.originPrimary < 2)
                      this.props.history.replace('/' + wave.json.id)
                    else
                      this.props.history.push('/' + wave.json.id)
                  }, 500)
                } else {
                  this.state.saveState = 'whoops'
                  this.setState(this.state)
                  alert(wave.text || wave.whoops)
                  setTimeout(() => {
                    if (this.state.saveState == 'whoops') {
                      delete this.state.saveState
                      this.setState(this.state)
                    }
                  }, 0)
                }
              }
            })
          }
        }>
      <table style={{width:'100%'}}>
        <tr>
          <td style={{width:'5%',textAlign:'right'}}>Title:&nbsp;</td>
          <td><input name="title" maxlength="200" style={{width:'100%'}} autofocus value={theTitle} disabled={theTitle == null} onChange={ e => { this.state.editedTitle=e.target.value; this.setState(this.state) }}/></td>
        </tr>
        <tr>
          <td style={{verticalAlign:'top',paddingTop:'.2em'}}>Content:&nbsp;</td>
          <td><textarea name="content" maxlength="50000" style={{width:'100%',height:'20em'}} value={this.state ? this.state.json ? this.state.editedContent : this.state.whoops : 'Loading...'} disabled={!this.state || !this.state.json} onChange={ e => { this.state.editedContent=e.target.value; this.setState(this.state) }}/></td>
        </tr>
        <tr>
          <td></td>
          <td style={{textAlign:'center'}}>
            <button type="submit" data-state={this.state.saveState} disabled={!this.state || !this.state.json}>{this.props.match.params.articleId ? 'Save Changes' : 'Save New Article'}</button>
            {this.props.match.params.articleId
                &&
              <> -or-
                <button type="button" class="link" data-state={this.state.deleteState}
                    onClick={e => {
                      if (this.state.deleteState) return // one at a time

                      this.state.deleteState = 'confirm'
                      this.setState(this.state)
                      setTimeout(() => {

                        if (!window.confirm('Really, delete this?')) {
                          delete this.state.deleteState
                          this.setState(this.state)
                          return
                        }

                        this.state.deleteState = 'hold'
                        this.setState(this.state)

                        this.request = ajaxWave({
                          url: phpEndpoints + 'save-delete.php/' + this.props.match.params.articleId,
                          postdata: '',
                          callback: wave => {
                            if (wave.json) {
                              delete this.props.appState.listingData[this.props.match.params.articleId]
                              localStoreOrDel('listingData', this.props.appState.listingData)
                              this.state.deleteState = 'thanks'
                              setTimeout(() => {
                                if (sessionStorage.originPrimary < 2) {
                                  window.history.back()
                                  window.history.back()
                                } else
                                  this.props.history.push('/')
                              }, 500)
                            } else {
                              this.state.deleteState = 'whoops'
                              this.setState(this.state)
                              alert(wave.text || wave.whoops)
                              setTimeout(() => {
                                if (this.state.deleteState == 'whoops') {
                                  delete this.state.deleteState
                                  this.setState(this.state)
                                }
                              }, 0)
                            }
                          }
                        })
                      }, 0)
                    }}>
                  Delete
                </button>
              </>}
          </td>
        </tr>
      </table>
    </form>)

    return elements
  }
}

class PageArticle extends Component {
  static historyDepth = 2
  componentDidMount() {
    initHistoryDepth(this.constructor.historyDepth)
    let appState = this.props.appState
    if (this.props.match.params.articleId)
      this.request = ajaxWave({
        url: phpEndpoints + 'fetch-one.php/' + this.props.match.params.articleId,
        callback: wave => {
          this.setState(wave)
          if (wave.json) {
            this.props.appState.listingData[wave.json.id] = { id: wave.json.id, title: wave.json.title }
            localStoreOrDel('listingData', this.props.appState.listingData)
          }
        }
      })
  }
  componentWillUnmount() {
    this.request.abort()
  }
  render() {
    let appState = this.props.appState
    var elements = []
    var theTitle = this.state && this.state.json ? this.state.json.title : (appState.listingData[this.props.match.params.articleId] || { title: null }).title || 'Article ID ' + this.props.match.params.articleId
    elements.push(<Link to={'/' + this.props.match.params.articleId + '/edit'} className="button" style={{float:'right'}}><span class="material-icons">edit</span> Edit Article</Link>)
    elements.push(<h2 style={{whiteSpace:'pre-wrap'}}><BackButton fallback="/" historyDepth={2}/> {theTitle}</h2>)
    if (this.state) {
      if (this.state.json) {
        elements.push(<p style={{whiteSpace:'pre-wrap'}}>{this.state.json.content}</p>)
      } else {
        elements.push(<b class="red">{ this.state.text || this.state.whoops }</b>)
      }
    } else
      elements.push(<b>Loading...</b>)
    return elements
  }
}
class PageListing extends Component {
  static historyDepth = 1
  constructor() {
    super(...arguments)
    this.state = { currentLetter: sessionStorage.currentLetter, listingData: this.props.appState.listingData }
  }
  componentDidMount() {
    initHistoryDepth(this.constructor.historyDepth)
    this.request = ajaxWave({
      url: phpEndpoints + 'fetch-list.php',
      callback: wave => {
        if (wave.json) {
          this.state.success = true
          this.state.listingData = this.props.appState.listingData = wave.json
          this.setState(this.state)
          localStoreOrDel('listingData', this.props.appState.listingData)
        } else {
          this.setState({ whoops: wave.text || wave.whoops })
        }
      }
    })
  }
  render() {
    let appState = this.props.appState
    var elements = []

    var allLetters = {}

    var allArticles = Object.values(appState.listingData)

    var listingData = this.state.currentLetter != null ? [] : allArticles
    for (var i = 0; i < allArticles.length; i++) {
      var thisArticleLetter = allArticles[i].title.charAt(0).toUpperCase()
      if (thisArticleLetter < 'A' || thisArticleLetter > 'Z')
        thisArticleLetter = '#'

      allLetters[thisArticleLetter] = true

      if (this.state.currentLetter == thisArticleLetter)
        listingData.push(allArticles[i])
    }

    elements.push(<Link to="/add" className="button" style={{float:'right'}}><span class="material-icons">add</span> Add Article</Link>)

    elements.push(<h2 style={{marginBottom:'.2em'}}>Here's all the articles{this.state.currentLetter == null ? "" : " starting with " + this.state.currentLetter}!</h2>)

    if (this.state.whoops)
      elements.push(<b class="red">{ this.state.whoops }</b>)
    else if (this.state.success)
        elements.push(<b><br/></b>)
    else
      elements.push(<b>Loading...</b>)

    allLetters = Object.keys(allLetters).sort()
    allLetters.unshift(null)
    var letterElements = []
    for (let letter of allLetters)
      letterElements.push(<> &nbsp; <a href="javascript:"
          onClick={e => { this.setState({ currentLetter: letter }); e.preventDefault() }}
          style={letter == this.state.currentLetter ? { fontWeight: 'bold', color: 'black' } : null}
          >
        {letter == null ? '[all]' : letter}</a></>)
    elements.push(<div className="small"><b>First letter index: </b>{letterElements}</div>)
    allLetters = Object.keys(allLetters).sort()

    elements.push(<div className="small"><br/></div>)

    listingData.sort(function (a, b) {
      var aL = a.title.toLowerCase()
      var bL = b.title.toLowerCase()
      return aL > bL ? 1 : aL < bL ? -1
        : a.title < b.title ? 1 : a.title > b.title ? -1
        : a.id < b.id ? 1 : -1
      return a > b ? 1 : -1
    })

    for (var i = 0; i < listingData.length; i++)
      elements.push(<div><Link to={'/' + listingData[i].id} style={{whiteSpace:'pre-wrap'}}>{listingData[i].title}</Link></div>)
    return elements
  }
}

class BackButton extends Component {
    render() {
        return <Link to={this.props.fallback} id="back" className="material-icons"
                onClick={ e => { if(sessionStorage.originPrimary<this.props.historyDepth){window.history.back();e.preventDefault()} }}
        >arrow_back</Link>
    }
}

function initHistoryDepth(starterDepth) {

    if (!sessionStorage.originPrimary) {
        sessionStorage.originPathname = window.location.pathname
        sessionStorage.originHash = window.location.hash

        sessionStorage.originPrimary = starterDepth
    }
}

function HeaderFooter(props) {
    return (
          <div id="fillin">
              <header><h1>Bryan's first ReactJS webapp with PHP</h1></header>
              <div className="dwidth">
                  {props.children}
              </div>
              <footer>☺</footer>
          </div>
    )
}

function ajaxWave(o) {

    if (!o.timeout) o.timeout = 1000 * 20

    var request = new XMLHttpRequest()

    var wave = { }

    request.onreadystatechange = function () {
        if (request.readyState != 4) return
        clearTimeout(timer)

        if (!wave.whoops) // check timeout reached
            if (request.status && request.status < 12000) {

                wave.ctype = request.getResponseHeader('Content-Type')
                if (wave.ctype) wave.ctype = wave.ctype.replace(/\s*;[\s\S]*/, '')

                wave.whoops = 'HTTP ' + request.status + ' error'

                if (wave.ctype == 'application/json') {
                    try {
                        wave.json = JSON.parse(request.responseText)
                    } catch(e) {
                        wave.whoops = 'JSON parse error'
                    }
                } else if (wave.ctype == 'text/plain')
                    wave.text = request.responseText
                else if (wave.ctype == 'text/html')
                    wave.html = request.responseText

            } else
                wave.whoops = 'Internet Connection Failure'

        if (o.callback)
            o.callback(wave, request)

    }

    request.open(o.postdata != null ? 'POST' : 'GET', o.url, true)
    if (typeof o.postdata == 'string')
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
    if (o.beforeSend)
        o.beforeSend(request)
    request.send(o.postdata)

    var timer = setTimeout(function () {
        wave.whoops = 'Timeout of ' + (o.timeout / 1000) + ' seconds.'
        request.abort()
    }, o.timeout)

    return request

}

function localStoreOrDel(k, json) {
  try {
    localStorage[k] = JSON.stringify(json)
  } catch (e) { // quota exceeded for localStorage on this origin
    delete localStorage[k]
  }
}

function formData(form) {
    var data = ''
    for (var i = 0; i < form.elements.length; i++) {
        var e = form.elements[i]
        if (e.tagName != 'BUTTON' && !e.disabled && e.name && (e.tagName != 'INPUT' || e.type != 'radio' && e.type != 'checkbox' || e.checked))
            if (e.tagName == 'select') {
                for (var j = 0; j < e.options.length; j++)
                    if (e.options[j].selected)
                        data += '&' + encodeURIComponent(e.name) + '=' + encodeURIComponent(e.options[j].value)
            } else
                data += '&' + encodeURIComponent(e.name) + '=' + encodeURIComponent(e.value)
    }
    return data.substring(1)
}
