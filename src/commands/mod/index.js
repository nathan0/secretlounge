import dude from 'debug-dude'
const { /*debug, log,*/ info /*, warn, error*/ } = dude('bot:commands:mod')

import { sendToAll, sendToUser, sendToMods } from '../../index'
import {
  cursive, htmlMessage,
  modInfoText, getUsername
} from '../../messages'
import { getFromCache, getCacheGroup, setWarnedFlag, hasWarnedFlag } from '../../cache'
import {
  getUserByUsername, getUser, getUsers,
  addWarning
} from '../../db'
import { ALREADY_WARNED } from '../../messages'
import { RANKS } from '../../ranks'
import { formatTime } from '../../time'

const getReason = (evt) =>
  evt.args.length > 0
  ? ' (' + evt.args.join(' ') + ')'
  : ''

const ERR_NO_REPLY = 'please reply to a message to use this command'

export default function modCommands (user, evt, reply) {
  let messageRepliedTo

  switch (evt.cmd) {
    case 'modsay':
      if (evt.args.length <= 0) return reply(cursive('please specify a message, e.g. /modsay message'))
      info('%o sent mod message -> %s', user, evt.args.join(' '))
      sendToAll(htmlMessage(evt.args.join(' ') + ' <b>~mods</b>'))
      break

    case 'info':
      if (evt && evt.raw && evt.raw.reply_to_message) {
        messageRepliedTo = getFromCache(evt, reply)
        if (messageRepliedTo) {
          const user = getUser(messageRepliedTo.sender)
          reply(htmlMessage(
            modInfoText(user)
          ))
        }
      }
      break

    case 'delete':
      messageRepliedTo = getFromCache(evt, reply)
      let replyCache = getCacheGroup(evt && evt.raw && evt.raw.reply_to_message && evt.raw.reply_to_message.message_id)

      if (messageRepliedTo) {
        // for everyone who is not a mod or higher, or not the sender, edit the message this is referencing.
        getUsers().map((user) => {
          if (user.rank < RANKS.mod && messageRepliedTo.sender !== user.id) {
            reply({
              type: 'editMessageText',
              chat: user.id,
              id: replyCache && replyCache[user.id],
              text: '<i>this message disappeared into the ether</i>',
              options: {
                parse_mode: 'HTML'
              }
            })
          }
        })
        sendToUser(messageRepliedTo.sender, {
          ...htmlMessage('<i>this message has now been deleted, only you can see the content of the above message</i>'),
          options: {
            reply_to_message_id: evt && evt.raw && evt.raw.reply_to_message && evt.raw.reply_to_message.message_id,
            parse_mode: 'HTML'
          }
        })
      } else {
        reply(cursive(ERR_NO_REPLY))
      }
      break

    case 'warn':
      messageRepliedTo = getFromCache(evt, reply)
      let cacheId = evt && evt.raw && evt.raw.reply_to_message && evt.raw.reply_to_message.message_id

      if (messageRepliedTo) {
        if (!hasWarnedFlag(cacheId)) {
          const cooldownTime = addWarning(messageRepliedTo.sender)
          setWarnedFlag(cacheId)
          sendToUser(messageRepliedTo.sender, {
            ...htmlMessage('<i>you\'ve been handed a cooldown of ' + formatTime(cooldownTime) + ' for this message</i>'),
            options: {
              reply_to_message_id: evt && evt.raw && evt.raw.reply_to_message && evt.raw.reply_to_message.message_id,
              parse_mode: 'HTML'
            }
          })
        } else {
          reply(cursive(ALREADY_WARNED))
        }
      } else {
        reply(cursive(ERR_NO_REPLY))
      }
      break
  }
}
