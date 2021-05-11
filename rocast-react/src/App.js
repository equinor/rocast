import logo from './logo.svg';
import './App.css';
import { OpenVidu as OpenViduBrowser } from 'openvidu-browser';
import { OpenVidu as OpenViduNodeClient } from 'openvidu-node-client';
import { useEffect, useRef, useState, Component } from 'react';
import axios from 'axios';

const App = () => {
  const [myUserName, setMyUserName] = useState('Participant' + Math.floor(Math.random() * 100));
  const [mySessionId, setMySessionId] = useState('SessionA');
  const [session, setSession] = useState(undefined);
  const [subscribers, setSubscribers] = useState([]);
  const OPENVIDU_SERVER_URL = 'https://' + window.location.hostname + ':4443';
  const OPENVIDU_SERVER_SECRET = 'MY_SECRET';


  useEffect(() => {
    joinSession();
  }, []);

  const joinSession = () => {
    const openViduBrowser = new OpenViduBrowser();
    setSession(openViduBrowser.initSession());
  };

  useEffect(() => {
    if (session !== undefined) {
      session.on('streamCreated', (event) => {
        console.log('stream is here')
        console.log(session)
        var subscriber = session.subscribe(event.stream, 'test');
        setSubscribers((currentSubscribers) => [...currentSubscribers, subscriber]);
        console.log(subscribers)
      });
      session.on('streamDestroyed', (event) => {
        console.log('Missing');
      });
      getToken().then((token) => {
        session.connect(
          token,
          { clientData: myUserName }
        ).then(() => {
          addIpCamera(mySessionId);
        });
      });
    }
  }, [session]);

  const addIpCamera = (sessionId) => {
    return new Promise((resolve, reject) => {
      var data = JSON.stringify({
        type: "IPCAM",
        data: "Office robot camera",
        record: false,
        rtspUri: "rtsp://10.0.0.51:554/stream2",
        adaptativeBitrate: true,
        onlyPlayWithSubscribers: false,
        networkCache: 100
      });
      axios
        .post(OPENVIDU_SERVER_URL + "/openvidu/api/sessions/" + sessionId + "/connection", data, {
          headers: {
            Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
            'Content-Type': 'application/json',
          },
        })
        .then((response) => {
          console.log('TOKEN', response);
          resolve(response.data.token);
        })
        .catch((error) => reject(error));
    });
  };

  const getToken = () => {
    return createSession(mySessionId).then((sessionId) => createToken(sessionId));
  }

  const createSession = (sessionId) => {
    return new Promise((resolve, reject) => {
      console.log(sessionId)
      var data = JSON.stringify({ customSessionId: sessionId });
      axios
        .post(OPENVIDU_SERVER_URL + '/openvidu/api/sessions', data, {
          headers: {
            Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
            'Content-Type': 'application/json',
          },
        })
        .then((response) => {
          console.log('CREATE SESION', response);
          resolve(response.data.id);
        })
        .catch((response) => {
          var error = Object.assign({}, response);
          if (error.response && error.response.status === 409) {
            resolve(sessionId);
          } else {
            console.log(error);
            console.warn(
              'No connection to OpenVidu Server. This may be a certificate error at ' +
              OPENVIDU_SERVER_URL,
            );
            if (
              window.confirm(
                'No connection to OpenVidu Server. This may be a certificate error at "' +
                OPENVIDU_SERVER_URL +
                '"\n\nClick OK to navigate and accept it. ' +
                'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                OPENVIDU_SERVER_URL +
                '"',
              )
            ) {
              window.location.assign(OPENVIDU_SERVER_URL + '/accept-certificate');
            }
          }
        });
    });
  };
  const createToken = (sessionId) => {
    return new Promise((resolve, reject) => {
      var data = {};
      axios
        .post(OPENVIDU_SERVER_URL + "/openvidu/api/sessions/" + sessionId + "/connection", data, {
          headers: {
            Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
            'Content-Type': 'application/json',
          },
        })
        .then((response) => {
          console.log('TOKEN', response);
          resolve(response.data.token);
        })
        .catch((error) => reject(error));
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <video id='test' />
    </div>
  );
}

/*
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      myUserName: 'Participant' + Math.floor(Math.random() * 100),
      session: undefined,
      subscribers: []
    }
    this.joinSession();
  }
  joinSession() {
    this.openViduBrowser = new OpenViduBrowser();
    console.log('hei')
    this.setState({
      session: this.openViduBrowser.initSession(),
    },
      () => {
        var mySession = this.state.session;
        console.log(mySession)
        mySession.on('streamCreated', (event) => {
          var subscriber = mySession.subscriber(event.stream, undefined);
          var subscribers = this.state.subscribers;
          subscribers.push(subscriber);
          this.setState({
            subscribers: subscribers,
          });
        });

        mySession.on('streamDestroyed', (event) => {
          this.deleteSubscriber(event.stream.streamManager);
        });

        this.getToken().then((token) => {
          // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
          // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
          mySession
            .connect(
              token,
              { clientData: this.state.myUserName },
            )
            .catch((error) => {
              console.log('There was an error connecting to the session:', error.code, error.message);
            });
        });
      });
  }
  // const refContainer = useRef(null);
  // useEffect(() => {
  //   var OPENVIDU_URL = "https://localhost:4443/";
  //   var OPENVIDU_SECRET = "MY_SECRET";
  //   var openViduNodeClient = new OpenViduNodeClient(OPENVIDU_URL, OPENVIDU_SECRET);
  //   var openViduBrowser = new OpenViduBrowser(OPENVIDU_URL, OPENVIDU_SECRET);
  //   var browserSession = openViduBrowser.initSession();
  //   console.log(browserSession);
  //   var properties = {};
  //   var sessionId = null;
  //   var subscriber = null;
  //   var token = null;
  //   openViduNodeClient.createSession(properties).then(session => {
  //     sessionId = session.sessionId;
  //     var connectionProperties = {
  //       role: "PUBLISHER",
  //       data: "user_data"
  //     };
  //     session.createConnection(connectionProperties).then(connection => {
  //       token = connection.token; // Send this string to the client side
  //       console.log('hei')
  //       console.log(token)
  //       var connectionProperties = {
  //         type: "IPCAM",
  //         rtspUri: "rtsp://10.0.0.51:554/stream2",
  //         adaptativeBitrate: true,
  //         onlyPlayWithSubscribers: false,
  //         networkCache: 10,
  //         token: token,
  //       };
  //       session.createConnection(connectionProperties).then(ipcamConnection => {
  //         console.log(ipcamConnection);
  //         console.log(token)
  //         browserSession.connect(token).then(() => {
  //           browserSession.on('streamCreated', event => {
  //             subscriber = browserSession.subscribe(event.stream, refContainer, { insertMode: 'APPEND' });
  //             subscriber.createVideoElement(refContainer, 'APPEND');
  //           });
  //         }).catch(error => console.error(error));
  //       }).catch(error => console.error(error));
  //     });


  //     // session.on('streamCreated', event => {
  //     //   subscriber = session.subscribe(event.stream, refContainer, { insertMode: 'APPEND' });
  //     // });
  //   }).catch(error => console.error(error));
  // }, []);
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}*/
export default App;
